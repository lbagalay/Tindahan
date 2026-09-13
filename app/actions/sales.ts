"use server";

import { PaymentMethod, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { businessHasModule } from "@/lib/platform-config.server";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";
import { revalidateBusiness } from "@/lib/queries";

/**
 * Retry a serializable transaction on write-conflict/deadlock (Prisma P2034).
 * Two cashiers completing sales at the same instant can serialize-conflict;
 * without a retry one of them would see a spurious "could not be completed".
 */
async function runWithRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const saleSchema = z.object({
  customerId: z.string().nullable().optional(),
  discount: z.number().nonnegative(),
  paymentMethod: z.enum(["CASH", "GCASH"]),
  amountReceived: z.number().nonnegative(),
  reference: z.string().max(100).optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive().max(99) })).min(1),
  // Set when a sale is rung up offline and later synced, so a retried sync
  // (e.g. the connection drops again right after the row is created) resolves
  // to the same transaction instead of posting the sale a second time.
  clientTransactionId: z.string().uuid().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;
export type SaleResult = { ok: true; transactionId: string; receiptNumber: string } | { ok: false; error: string };

export async function completeSale(input: SaleInput): Promise<SaleResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "You must sign in before completing a sale." };
  if (!await businessHasModule(session.user.businessId, "pos")) return { ok: false, error: "Point of sale is not enabled." };

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The sale information is incomplete or invalid." };

  try {
    if (parsed.data.clientTransactionId) {
      const existing = await prisma.transaction.findUnique({ where: { clientTransactionId: parsed.data.clientTransactionId }, select: { id: true, receiptNumber: true, businessId: true } });
      if (existing) {
        if (existing.businessId !== session.user.businessId) return { ok: false, error: "This sale does not belong to your business." };
        return { ok: true, transactionId: existing.id, receiptNumber: existing.receiptNumber };
      }
    }
  } catch {
    return { ok: false, error: "Could not verify this sale hasn't already been recorded. Try syncing again." };
  }

  try {
    const result = await runWithRetry(() => prisma.$transaction(async (tx) => {
      const businessId = session.user.businessId;
      const ids = parsed.data.items.map((item) => item.productId);
      const settings = await tx.businessSettings.findUnique({ where: { businessId } });
      const platform = resolvePlatformConfig(settings);
      const products = await tx.product.findMany({ where: { id: { in: ids }, businessId, status: "ACTIVE", ...templateCatalogScope(platform.templateId) } });
      if (products.length !== ids.length) throw new Error("One or more items are no longer available.");
      if (parsed.data.customerId) {
        const customer = await tx.customer.findFirst({ where: { id: parsed.data.customerId, businessId }, select: { id: true } });
        if (!customer) throw new Error("The selected customer is no longer available.");
      }

      // A product with a recipe is sold by drawing down its ingredients — it never
      // carries its own stock count. A product with no recipe keeps the original
      // direct stock tracking (this is what non-recipe templates like Retail use).
      const recipeItems = await tx.recipeItem.findMany({ where: { productId: { in: ids } }, include: { ingredient: true } });
      const recipesByProduct = new Map<string, typeof recipeItems>();
      for (const item of recipeItems) recipesByProduct.set(item.productId, [...(recipesByProduct.get(item.productId) ?? []), item]);

      let subtotal = new Prisma.Decimal(0);
      const lines = parsed.data.items.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId)!;
        const recipe = recipesByProduct.get(product.id) ?? [];
        if (product.type === "PRODUCT" && recipe.length === 0 && product.stock < item.quantity) throw new Error(`${product.name} only has ${product.stock} unit(s) available.`);
        const lineTotal = product.price.mul(item.quantity);
        subtotal = subtotal.add(lineTotal);
        return { product, quantity: item.quantity, lineTotal, recipe };
      });

      // Aggregate ingredient consumption across the whole cart first, since two
      // different menu items in the same order can share an ingredient (e.g. milk).
      const ingredientConsumption = new Map<string, { ingredient: (typeof recipeItems)[number]["ingredient"]; quantity: Prisma.Decimal }>();
      for (const line of lines) {
        for (const recipeLine of line.recipe) {
          const needed = recipeLine.quantity.mul(line.quantity);
          const existing = ingredientConsumption.get(recipeLine.ingredientId);
          ingredientConsumption.set(recipeLine.ingredientId, { ingredient: recipeLine.ingredient, quantity: existing ? existing.quantity.add(needed) : needed });
        }
      }
      for (const { ingredient, quantity } of ingredientConsumption.values()) {
        if (ingredient.stock.lessThan(quantity)) throw new Error(`${ingredient.name} only has ${ingredient.stock} ${ingredient.unit} available.`);
      }

      const business = await tx.business.findUniqueOrThrow({ where: { id: businessId }, select: { name: true } });
      const discount = Prisma.Decimal.min(new Prisma.Decimal(parsed.data.discount), subtotal);
      const taxRate = settings?.taxPercentage ?? new Prisma.Decimal(0);
      const taxable = subtotal.sub(discount);
      // Prices already include VAT, so tax is the portion of the taxable amount
      // already baked in — the total charged is the taxable amount itself, not
      // taxable + tax on top.
      const tax = taxable.mul(taxRate).div(new Prisma.Decimal(100).add(taxRate)).toDecimalPlaces(2);
      const total = taxable;
      if (parsed.data.paymentMethod === "CASH" && new Prisma.Decimal(parsed.data.amountReceived).lessThan(total)) throw new Error("The amount received is less than the total due.");

      const today = new Date();
      const dateKey = `${String(today.getFullYear()).slice(-2)}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      const todayCount = await tx.transaction.count({ where: { businessId, createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } });
      const prefix = business.name.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "POS";
      const receiptNumber = `${prefix}-${dateKey}-${String(todayCount + 1).padStart(4, "0")}`;

      const transaction = await tx.transaction.create({
        data: {
          businessId, receiptNumber, customerId: parsed.data.customerId || null, staffId: session.user.id, clientTransactionId: parsed.data.clientTransactionId ?? null, subtotal, discount, tax, total,
          items: { create: lines.map(({ product, quantity, lineTotal }) => ({ productId: product.id, name: product.name, sku: product.sku, type: product.type, quantity, unitPrice: product.price, unitCost: product.cost, lineTotal })) },
          payments: { create: { method: parsed.data.paymentMethod as PaymentMethod, amount: total, amountReceived: parsed.data.paymentMethod === "CASH" ? parsed.data.amountReceived : total, change: parsed.data.paymentMethod === "CASH" ? new Prisma.Decimal(parsed.data.amountReceived).sub(total) : 0, reference: parsed.data.reference || null } },
        },
      });

      for (const { product, quantity, recipe } of lines) {
        if (product.type !== "PRODUCT" || recipe.length > 0) continue; // recipe-linked items draw down ingredients instead, below
        const updated = await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: quantity } } });
        await tx.inventoryMovement.create({ data: { businessId, productId: product.id, createdById: session.user.id, transactionId: transaction.id, type: "SALE", quantity: -quantity, stockBefore: product.stock, stockAfter: updated.stock, reason: `Sale ${receiptNumber}` } });
      }

      for (const [ingredientId, { ingredient, quantity }] of ingredientConsumption) {
        const updated = await tx.ingredient.update({ where: { id: ingredientId }, data: { stock: { decrement: quantity } } });
        await tx.ingredientMovement.create({ data: { businessId, ingredientId, createdById: session.user.id, transactionId: transaction.id, type: "SALE", quantity: quantity.neg(), stockBefore: ingredient.stock, stockAfter: updated.stock, reason: `Sale ${receiptNumber}` } });
      }
      return { transactionId: transaction.id, receiptNumber };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));

    revalidateBusiness(session.user.businessId); revalidatePath("/"); revalidatePath("/pos"); revalidatePath("/inventory"); revalidatePath("/ingredients"); revalidatePath("/customers"); revalidatePath("/transactions"); revalidatePath("/reports");
    return { ok: true, ...result };
  } catch (error) {
    // Two racing retries of the same offline sale can both pass the earlier lookup
    // and then collide here on the unique clientTransactionId — resolve to the
    // row that won instead of surfacing a spurious failure.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && parsed.data.clientTransactionId) {
      const existing = await prisma.transaction.findUnique({ where: { clientTransactionId: parsed.data.clientTransactionId }, select: { id: true, receiptNumber: true } });
      if (existing) return { ok: true, transactionId: existing.id, receiptNumber: existing.receiptNumber };
    }
    return { ok: false, error: error instanceof Error ? error.message : "The transaction could not be completed." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { businessHasModule, getBusinessPlatformConfig } from "@/lib/platform-config.server";
import { templateCatalogScope } from "@/lib/platform-config";

const adjustmentSchema = z.object({ productId: z.string(), quantity: z.number().int(), reason: z.string().min(3).max(250), type: z.enum(["RESTOCK", "ADJUSTMENT"]) });

export async function adjustInventory(input: z.infer<typeof adjustmentSchema>) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "inventory")) return { ok: false, error: "Inventory is not enabled." };
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success || parsed.data.quantity === 0) return { ok: false, error: "Enter a valid stock adjustment." };
  try {
    const platform = await getBusinessPlatformConfig(session.user.businessId);
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirstOrThrow({ where: { id: parsed.data.productId, businessId: session.user.businessId, type: "PRODUCT", ...templateCatalogScope(platform.templateId) } });
      const delta = parsed.data.type === "RESTOCK" ? Math.abs(parsed.data.quantity) : parsed.data.quantity;
      const nextStock = product.stock + delta;
      if (nextStock < 0) throw new Error("The adjustment would make stock negative.");
      await tx.product.update({ where: { id: product.id }, data: { stock: nextStock } });
      const movement = await tx.inventoryMovement.create({ data: { businessId: session.user.businessId, productId: product.id, createdById: session.user.id, type: parsed.data.type, quantity: delta, stockBefore: product.stock, stockAfter: nextStock, reason: parsed.data.reason } });
      return { id: movement.id, product: product.name, sku: product.sku, change: delta, before: product.stock, after: nextStock };
    });
    revalidatePath("/"); revalidatePath("/inventory"); revalidatePath("/products"); revalidatePath("/pos");
    return { ok: true, movement: { ...result, type: parsed.data.type === "RESTOCK" ? "Restock" : "Adjustment", by: session.user.name ?? "Staff", time: new Date().toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }), reason: parsed.data.reason } };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Stock could not be updated." }; }
}

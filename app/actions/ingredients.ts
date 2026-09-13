"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { businessHasModule } from "@/lib/platform-config.server";
import { revalidateBusiness } from "@/lib/queries";

const ingredientSchema = z.object({
  name: z.string().trim().min(2).max(80),
  unit: z.string().trim().min(1).max(20),
  stock: z.number().nonnegative(),
  lowStockThreshold: z.number().nonnegative(),
});

export async function createIngredient(input: z.infer<typeof ingredientSchema>) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "ingredients")) return { ok: false as const, error: "Ingredients is not enabled." };
  const parsed = ingredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the ingredient details and try again." };
  try {
    const businessId = session.user.businessId;
    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({ data: { businessId, name: parsed.data.name, unit: parsed.data.unit, stock: parsed.data.stock, lowStockThreshold: parsed.data.lowStockThreshold } });
      if (parsed.data.stock > 0) {
        await tx.ingredientMovement.create({ data: { businessId, ingredientId: created.id, createdById: session.user.id, type: "OPENING_STOCK", quantity: new Prisma.Decimal(parsed.data.stock), stockBefore: 0, stockAfter: created.stock, reason: "Opening stock on ingredient creation" } });
      }
      return created;
    });
    revalidateBusiness(businessId); revalidatePath("/ingredients"); revalidatePath("/products");
    return { ok: true as const, id: ingredient.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false as const, error: "An ingredient with that name already exists." };
    return { ok: false as const, error: "The ingredient could not be created." };
  }
}

const updateIngredientSchema = z.object({ id: z.string(), name: z.string().trim().min(2).max(80), unit: z.string().trim().min(1).max(20), lowStockThreshold: z.number().nonnegative() });

export async function updateIngredient(input: z.infer<typeof updateIngredientSchema>) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized." };
  const parsed = updateIngredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the ingredient details and try again." };
  try {
    await prisma.ingredient.update({ where: { id: parsed.data.id, businessId: session.user.businessId }, data: { name: parsed.data.name, unit: parsed.data.unit, lowStockThreshold: parsed.data.lowStockThreshold } });
    revalidateBusiness(session.user.businessId); revalidatePath("/ingredients"); revalidatePath("/products");
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false as const, error: "An ingredient with that name already exists." };
    return { ok: false as const, error: "The ingredient could not be updated." };
  }
}

const adjustSchema = z.object({ ingredientId: z.string(), quantity: z.number(), reason: z.string().min(3).max(250), type: z.enum(["RESTOCK", "ADJUSTMENT"]) });

export async function adjustIngredientStock(input: z.infer<typeof adjustSchema>) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "ingredients")) return { ok: false, error: "Ingredients is not enabled." };
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success || parsed.data.quantity === 0) return { ok: false, error: "Enter a valid stock adjustment." };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findFirstOrThrow({ where: { id: parsed.data.ingredientId, businessId: session.user.businessId } });
      const delta = parsed.data.type === "RESTOCK" ? Math.abs(parsed.data.quantity) : parsed.data.quantity;
      const nextStock = ingredient.stock.add(delta);
      if (nextStock.lessThan(0)) throw new Error("The adjustment would make stock negative.");
      await tx.ingredient.update({ where: { id: ingredient.id }, data: { stock: nextStock } });
      const movement = await tx.ingredientMovement.create({ data: { businessId: session.user.businessId, ingredientId: ingredient.id, createdById: session.user.id, type: parsed.data.type, quantity: new Prisma.Decimal(delta), stockBefore: ingredient.stock, stockAfter: nextStock, reason: parsed.data.reason } });
      return { id: movement.id, ingredient: ingredient.name, unit: ingredient.unit, change: delta, before: Number(ingredient.stock), after: Number(nextStock) };
    });
    revalidateBusiness(session.user.businessId); revalidatePath("/ingredients"); revalidatePath("/products"); revalidatePath("/pos");
    return { ok: true, movement: { ...result, type: parsed.data.type === "RESTOCK" ? "Restock" : "Adjustment", by: session.user.name ?? "Staff", time: new Date().toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }), reason: parsed.data.reason } };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Stock could not be updated." }; }
}

const recipeSchema = z.object({ productId: z.string(), items: z.array(z.object({ ingredientId: z.string(), quantity: z.number().positive() })).max(30) });

export async function updateProductRecipe(input: z.infer<typeof recipeSchema>) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Not authorized." };
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the recipe and try again." };
  try {
    const businessId = session.user.businessId;
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirstOrThrow({ where: { id: parsed.data.productId, businessId } });
      const ingredientIds = parsed.data.items.map((item) => item.ingredientId);
      if (ingredientIds.length) {
        const owned = await tx.ingredient.count({ where: { id: { in: ingredientIds }, businessId } });
        if (owned !== new Set(ingredientIds).size) throw new Error("One or more ingredients are no longer available.");
      }
      await tx.recipeItem.deleteMany({ where: { productId: product.id } });
      if (parsed.data.items.length) await tx.recipeItem.createMany({ data: parsed.data.items.map((item) => ({ productId: product.id, ingredientId: item.ingredientId, quantity: item.quantity })) });
    });
    revalidateBusiness(businessId); revalidatePath("/products"); revalidatePath("/pos"); revalidatePath("/ingredients");
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "The recipe could not be saved." }; }
}

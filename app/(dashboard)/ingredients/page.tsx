import { PageHeader } from "@/components/ui/page-header";
import { IngredientManager, type IngredientItem, type IngredientMovementItem } from "@/components/ingredients/ingredient-manager";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";

export default async function IngredientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.ingredients) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const businessId = session.user.businessId;
  const [records, movementRecords, movementsToday, settings] = await Promise.all([
    prisma.ingredient.findMany({ where: { businessId }, orderBy: { name: "asc" } }),
    prisma.ingredientMovement.findMany({ where: { businessId }, include: { ingredient: true, createdBy: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.ingredientMovement.count({ where: { businessId, createdAt: { gte: today } } }),
    prisma.businessSettings.findUnique({ where: { businessId }, select: { currency: true } }),
  ]);
  const ingredients: IngredientItem[] = records.map((item) => ({ id: item.id, name: item.name, unit: item.unit, stock: Number(item.stock), lowStockThreshold: Number(item.lowStockThreshold) }));
  const movements: IngredientMovementItem[] = movementRecords.map((movement) => ({ id: movement.id, ingredient: movement.ingredient.name, unit: movement.ingredient.unit, type: movement.type.replace("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()), change: Number(movement.quantity), before: Number(movement.stockBefore), after: Number(movement.stockAfter), by: movement.createdBy.name, time: movement.createdAt.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }), reason: movement.reason ?? undefined }));
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Raw materials" title="Ingredients" description="Track the coffee beans, milk, cups, and other raw materials your menu items are made from. Selling a menu item with a recipe draws down its ingredients automatically." /><div className="mt-6"><IngredientManager initialIngredients={ingredients} initialMovements={movements} initialMovementsToday={movementsToday} currency={settings?.currency} /></div></div>;
}

import { PageHeader } from "@/components/ui/page-header";
import { InventoryManager } from "@/components/inventory/inventory-manager";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DemoMovement, DemoProduct } from "@/lib/demo-data";
import { redirect } from "next/navigation";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";
import { templateCatalogScope } from "@/lib/platform-config";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.inventory) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const catalogScope = templateCatalogScope(platform.templateId);
  const [records, movementRecords, movementsToday, settings] = await Promise.all([prisma.product.findMany({ where: { businessId: session.user.businessId, type: "PRODUCT", ...catalogScope }, include: { category: true }, orderBy: { name: "asc" } }), prisma.inventoryMovement.findMany({ where: { businessId: session.user.businessId, product: catalogScope }, include: { product: true, createdBy: true }, orderBy: { createdAt: "desc" }, take: 50 }), prisma.inventoryMovement.count({ where: { businessId: session.user.businessId, product: catalogScope, createdAt: { gte: today } } }), prisma.businessSettings.findUnique({ where: { businessId: session.user.businessId }, select: { currency: true } })]);
  const products: DemoProduct[] = records.map((item) => ({ id: item.id, name: item.name, sku: item.sku, category: item.category?.name ?? "Uncategorized", type: item.type, image: item.image ?? undefined, cost: Number(item.cost), price: Number(item.price), stock: item.stock, threshold: item.lowStockThreshold, status: item.status, accent: "bg-[var(--brand-soft)] text-[var(--brand)]", short: item.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() }));
  const movements: DemoMovement[] = movementRecords.map((movement) => ({ id: movement.id, product: movement.product.name, sku: movement.product.sku, type: movement.type.replace("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()), change: movement.quantity, before: movement.stockBefore, after: movement.stockAfter, by: movement.createdBy.name, time: movement.createdAt.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }), reason: movement.reason ?? undefined }));
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Stock control" title={platform.terminology.inventory} description={`Track current ${platform.terminology.products.toLowerCase()}, restocking, adjustments, and the complete movement history.`} /><div className="mt-6"><InventoryManager initialProducts={products} initialMovements={movements} initialMovementsToday={movementsToday} currency={settings?.currency} /></div></div>;
}

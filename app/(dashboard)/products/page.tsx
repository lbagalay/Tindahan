import { CatalogManager } from "@/components/catalog/catalog-manager";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DemoProduct } from "@/lib/demo-data";
import { readCustomFields, readCustomValues } from "@/lib/customization";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";
import { templateCatalogScope } from "@/lib/platform-config";
import { redirect } from "next/navigation";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.catalog) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const { query = "" } = await searchParams;
  const [records, settings, ingredientRecords, recipeRecords] = await Promise.all([
    prisma.product.findMany({ where: { businessId: session.user.businessId, ...templateCatalogScope(platform.templateId) }, include: { category: true }, orderBy: { name: "asc" } }),
    prisma.businessSettings.findUnique({ where: { businessId: session.user.businessId }, select: { currency: true, productCustomFields: true } }),
    prisma.ingredient.findMany({ where: { businessId: session.user.businessId }, orderBy: { name: "asc" } }),
    prisma.recipeItem.findMany({ where: { product: { businessId: session.user.businessId } } }),
  ]);
  const recipesByProduct = new Map<string, { ingredientId: string; quantity: number }[]>();
  for (const item of recipeRecords) recipesByProduct.set(item.productId, [...(recipesByProduct.get(item.productId) ?? []), { ingredientId: item.ingredientId, quantity: Number(item.quantity) }]);
  const products: DemoProduct[] = records.map((item) => ({ id: item.id, name: item.name, sku: item.sku, category: item.category?.name ?? "Uncategorized", type: item.type, image: item.image ?? undefined, customValues: readCustomValues(item.customValues), cost: Number(item.cost), price: Number(item.price), stock: item.stock, threshold: item.lowStockThreshold, status: item.status, accent: "bg-[var(--brand-soft)] text-[var(--brand)]", short: item.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase(), recipe: recipesByProduct.get(item.id) ?? [] }));
  const ingredients = platform.modules.ingredients ? ingredientRecords.map((item) => ({ id: item.id, name: item.name, unit: item.unit })) : [];
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Catalog" title={platform.terminology.catalog} description={`Manage your ${platform.terminology.products.toLowerCase()} and ${platform.terminology.services.toLowerCase()} from one shared catalog.`} /><div className="mt-6"><CatalogManager initialProducts={products} initialQuery={query} currency={settings?.currency} customFields={readCustomFields(settings?.productCustomFields)} terminology={platform.terminology} examples={platform.examples} ingredients={ingredients} recipesEnabled={platform.modules.ingredients} /></div></div>;
}

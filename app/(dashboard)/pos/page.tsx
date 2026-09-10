import type { Metadata } from "next";
import { PosWorkspace, type PosBusiness, type PosCustomer } from "@/components/pos/pos-workspace";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DemoProduct } from "@/lib/demo-data";
import { redirect } from "next/navigation";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";
import { templateCatalogScope } from "@/lib/platform-config";

export const metadata: Metadata = { title: "Point of sale" };

export default async function PosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.pos) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const [records, customerRecords, businessRecord] = await Promise.all([
    prisma.product.findMany({ where: { businessId: session.user.businessId, status: "ACTIVE", ...templateCatalogScope(platform.templateId) }, include: { category: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { businessId: session.user.businessId }, include: { _count: { select: { transactions: true } } }, orderBy: { name: "asc" } }),
    prisma.business.findUniqueOrThrow({ where: { id: session.user.businessId }, include: { settings: true } }),
  ]);
  const products: DemoProduct[] = records.map((item) => ({ id: item.id, name: item.name, sku: item.sku, category: item.category?.name ?? "Uncategorized", type: item.type, image: item.image ?? undefined, cost: Number(item.cost), price: Number(item.price), stock: item.stock, threshold: item.lowStockThreshold, status: item.status, accent: "bg-[var(--brand-soft)] text-[var(--brand)]", short: item.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() }));
  const customers: PosCustomer[] = customerRecords.map((item) => ({ id: item.id, name: item.name, phone: item.phone, transactions: item._count.transactions }));
  const business: PosBusiness = { id: businessRecord.id, name: businessRecord.name, logo: businessRecord.settings?.logo ?? "", address: businessRecord.settings?.address ?? "", phone: businessRecord.settings?.phone ?? "", currency: businessRecord.settings?.currency ?? "PHP", taxPercentage: Number(businessRecord.settings?.taxPercentage ?? 0), receiptFooter: businessRecord.settings?.receiptFooter ?? "Thank you for your purchase.", cashierName: session.user.name ?? "Staff", receiptLayout: businessRecord.settings?.receiptLayout === "COMPACT" ? "COMPACT" : "DETAILED" };
  return <PosWorkspace initialProducts={products} initialCustomers={customers} business={business} terminology={platform.terminology} />;
}

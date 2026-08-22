import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";
import { PageHeader } from "@/components/ui/page-header";
import { JobOrderManager, type JobOrderRow } from "@/components/job-orders/job-order-manager";

export default async function JobOrdersPage() {
  const session = await auth(); if (!session?.user) redirect("/login"); const businessId = session.user.businessId;
  const settings = await prisma.businessSettings.findUnique({ where: { businessId }, select: { templateId: true, enabledModules: true, featureFlags: true, terminology: true, currency: true } });
  const platform = resolvePlatformConfig(settings);
  if (!platform.modules.jobOrders) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const [records, customers, products, memberships] = await Promise.all([
    prisma.jobOrder.findMany({ where: { businessId }, include: { customer: true, product: true, assignedTo: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.customer.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { businessId, status: "ACTIVE", ...templateCatalogScope(platform.templateId) }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.membership.findMany({ where: { businessId }, include: { user: { select: { id: true, name: true } } } }),
  ]);
  const jobOrders: JobOrderRow[] = records.map((item) => ({ id: item.id, referenceNumber: item.referenceNumber, title: item.title, customer: item.customer?.name ?? "No customer", item: item.product?.name ?? "No linked item", assignedTo: item.assignedTo?.name ?? "Unassigned", status: item.status, estimatedAmount: item.estimatedAmount === null ? null : Number(item.estimatedAmount), due: item.dueAt?.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }) ?? "No due date", description: item.description ?? "" }));
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Service workflow" title={platform.terminology.jobOrders} description="Track repair, installation, and service work from intake to completion." /><div className="mt-6"><JobOrderManager jobOrders={jobOrders} customers={customers} products={products} staff={memberships.map((item) => item.user)} currency={settings?.currency ?? "PHP"} examples={platform.examples} /></div></div>;
}

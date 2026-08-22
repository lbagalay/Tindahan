import { CustomerManager } from "@/components/customers/customer-manager";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DemoCustomer } from "@/lib/demo-data";
import { readCustomFields, readCustomValues } from "@/lib/customization";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";
import { redirect } from "next/navigation";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.customers) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const { query = "" } = await searchParams;
  const [records, settings] = await Promise.all([prisma.customer.findMany({ where: { businessId: session.user.businessId }, include: { transactions: { where: { status: "COMPLETED" }, select: { total: true, createdAt: true }, orderBy: { createdAt: "desc" } } }, orderBy: { name: "asc" } }), prisma.businessSettings.findUnique({ where: { businessId: session.user.businessId }, select: { currency: true, customerCustomFields: true } })]);
  const customers: DemoCustomer[] = records.map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone ?? "", email: customer.email ?? "", notes: customer.notes ?? "", customValues: readCustomValues(customer.customValues), transactions: customer.transactions.length, total: customer.transactions.reduce((sum, transaction) => sum + Number(transaction.total), 0), last: customer.transactions[0]?.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) ?? "No purchases yet", initials: customer.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() }));
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Relationships" title={platform.terminology.customers} description={`Keep contact details, purchase history, and ${platform.terminology.customer.toLowerCase()} value in one place.`} /><div className="mt-6"><CustomerManager initialCustomers={customers} initialQuery={query} currency={settings?.currency} customFields={readCustomFields(settings?.customerCustomFields)} terminology={platform.terminology} examples={platform.examples} /></div></div>;
}

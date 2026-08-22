import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TransactionList, type TransactionListItem } from "@/components/transactions/transaction-list";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.transactions) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const [records, settings] = await Promise.all([prisma.transaction.findMany({ where: { businessId: session.user.businessId }, include: { customer: true, staff: true, payments: { take: 1 }, _count: { select: { items: true } } }, orderBy: { createdAt: "desc" }, take: 500 }), prisma.businessSettings.findUnique({ where: { businessId: session.user.businessId }, select: { currency: true } })]);
  const transactions: TransactionListItem[] = records.map((transaction) => {
    const customer = transaction.customer?.name ?? "Walk-in customer";
    const method = transaction.payments[0]?.method;
    return { id: transaction.id, receipt: transaction.receiptNumber, customer, initials: customer.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), staffId: transaction.staffId, staff: transaction.staff.name, items: transaction._count.items, method: method === "GCASH" ? "GCash" : method?.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) ?? "Other", total: Number(transaction.total), createdAt: transaction.createdAt.getTime(), time: transaction.createdAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }), date: transaction.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }), status: transaction.status.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) };
  });
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Sales ledger" title={platform.terminology.transactions} description={`Review completed sales, payment details, ${platform.terminology.staff.toLowerCase()} activity, and receipts.`} />
    <TransactionList transactions={transactions} currency={settings?.currency} />
  </div>;
}

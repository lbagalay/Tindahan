import Link from "next/link";
import { ArrowRight, ArrowUpRight, Boxes, ReceiptText, ShoppingBag, Users } from "lucide-react";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { moneyFor } from "@/lib/utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { readDashboardWidgets } from "@/lib/customization";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const businessId = session.user.businessId; const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { name: true, settings: { select: { currency: true, dashboardWidgets: true, templateId: true, enabledModules: true, featureFlags: true, terminology: true } } } });
  const platform = resolvePlatformConfig(business.settings);
  const [todayTransactions, customerCount, products, recentRecords, weekTransactions, monthItems] = await Promise.all([
    prisma.transaction.findMany({ where: { businessId, status: "COMPLETED", createdAt: { gte: today } }, select: { total: true } }),
    prisma.customer.count({ where: { businessId } }),
    prisma.product.findMany({ where: { businessId, type: "PRODUCT", status: "ACTIVE", ...templateCatalogScope(platform.templateId) }, orderBy: { stock: "asc" } }),
    prisma.transaction.findMany({ where: { businessId }, include: { customer: true, payments: { take: 1 } }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.transaction.findMany({ where: { businessId, status: "COMPLETED", createdAt: { gte: weekStart } }, select: { total: true, createdAt: true } }),
    prisma.transactionItem.findMany({ where: { transaction: { businessId, status: "COMPLETED", createdAt: { gte: monthStart } } }, select: { name: true, type: true, quantity: true, lineTotal: true } }),
  ]);
  const money = moneyFor(business.settings?.currency);
  const widgets = readDashboardWidgets(business.settings?.dashboardWidgets);
  const todaySales = todayTransactions.reduce((sum, item) => sum + Number(item.total), 0); const lowStockProducts = products.filter((item) => item.stock <= item.lowStockThreshold); const lowStock = lowStockProducts.slice(0, 4);
  const metrics = [
    { label: "Today’s sales", value: money.format(todaySales), note: "From completed sales today", icon: ShoppingBag, tone: "text-[var(--brand)] bg-[var(--brand-soft)]" },
    ...(platform.modules.transactions ? [{ label: platform.terminology.transactions, value: String(todayTransactions.length), note: `${money.format(todayTransactions.length ? todaySales / todayTransactions.length : 0)} average sale`, icon: ReceiptText, tone: "text-blue-700 bg-blue-50" }] : []),
    ...(platform.modules.customers ? [{ label: `Total ${platform.terminology.customers.toLowerCase()}`, value: String(customerCount), note: `Registered ${platform.terminology.customer.toLowerCase()} records`, icon: Users, tone: "text-violet-700 bg-violet-50" }] : []),
    ...(platform.modules.inventory ? [{ label: "Low-stock items", value: String(lowStockProducts.length), note: "Needs your attention", icon: Boxes, tone: "text-amber-700 bg-amber-50" }] : []),
  ];
  const salesData = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return { day: date.toLocaleDateString("en-PH", { weekday: "short" }), sales: weekTransactions.filter((item) => item.createdAt.toDateString() === date.toDateString()).reduce((sum, item) => sum + Number(item.total), 0) }; });
  const weekTotal = salesData.reduce((sum, item) => sum + item.sales, 0); const sellerMap = new Map<string, { name: string; category: string; sold: number; revenue: number }>(); monthItems.forEach((item) => { const current = sellerMap.get(item.name) ?? { name: item.name, category: item.type === "SERVICE" ? "Service" : "Product", sold: 0, revenue: 0 }; current.sold += item.quantity; current.revenue += Number(item.lineTotal); sellerMap.set(item.name, current); }); const bestSellers = [...sellerMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const recentTransactions = recentRecords.map((item) => ({ id: item.id, receipt: item.receiptNumber, customer: item.customer?.name ?? "Walk-in customer", method: item.payments[0]?.method === "GCASH" ? "GCash" : item.payments[0]?.method.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) ?? "Other", time: item.createdAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }), total: Number(item.total) }));
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader
        eyebrow={now.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        title={`${greeting}, ${session?.user.name?.split(" ")[0] ?? "there"}`}
        description={`Here’s what’s happening at ${business.name} today.`}
        actions={platform.modules.pos ? <Link href="/pos"><Button><ShoppingBag size={17} /> New sale</Button></Link> : undefined}
      />

      {widgets.includes("metrics") ? <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">{metric.value}</p>
              </div>
              <span className={`grid size-9 place-items-center rounded-lg ${metric.tone}`}><metric.icon size={18} /></span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-slate-500">
              {metric.label === "Today’s sales" ? <ArrowUpRight size={13} className="text-[var(--brand)]" /> : null}{metric.note}
            </p>
          </article>
        ))}
      </section> : null}

      {widgets.includes("salesChart") || widgets.includes("lowStock") ? <section className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        {widgets.includes("salesChart") ? <article className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
          <div className="mb-2 flex items-start justify-between">
            <div><h2 className="font-bold text-slate-900">Sales this week</h2><p className="mt-1 text-xs text-slate-500">Last 7 days · {money.format(weekTotal)} total</p></div>
            <Badge tone="success">Live data</Badge>
          </div>
          <SalesChart data={salesData} currency={business.settings?.currency} />
        </article> : null}

        {widgets.includes("lowStock") && platform.modules.inventory ? <article className="rounded-xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div><h2 className="font-bold text-slate-900">Low stock</h2><p className="mt-0.5 text-xs text-slate-500">Products at or below threshold</p></div>
            <Link href="/inventory" className="text-xs font-bold text-[var(--brand)]">View inventory</Link>
          </div>
          <div className="divide-y divide-slate-100 px-5">
            {lowStock.map((product) => (
              <div key={product.id} className="flex items-center gap-3 py-4">
                <span className="grid size-10 place-items-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800">{product.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{product.name}</p><p className="mt-1 text-[11px] text-slate-500">{product.sku}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-amber-700">{product.stock} left</p><p className="text-[10px] text-slate-400">Min. {product.lowStockThreshold}</p></div>
              </div>
            ))}
            {!lowStock.length ? <div className="py-10 text-center"><p className="text-xs font-bold text-slate-700">Stock levels are healthy</p><p className="mt-1 text-[11px] text-slate-500">No products are at or below their thresholds.</p></div> : null}
          </div>
        </article> : null}
      </section> : null}

      {widgets.includes("recentTransactions") || widgets.includes("bestSellers") ? <section className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        {widgets.includes("recentTransactions") && platform.modules.transactions ? <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div><h2 className="font-bold text-slate-900">Recent transactions</h2><p className="mt-0.5 text-xs text-slate-500">Latest completed sales</p></div>
            <Link href="/transactions" className="flex items-center gap-1 text-xs font-bold text-[var(--brand)]">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3 font-bold">Receipt</th><th className="px-4 py-3 font-bold">Customer</th><th className="px-4 py-3 font-bold">Payment</th><th className="px-4 py-3 font-bold">Time</th><th className="px-5 py-3 text-right font-bold">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50/70"><td className="px-5 py-3.5 text-xs font-bold text-[var(--brand)]"><Link href={`/transactions/${transaction.id}`} className="hover:underline">{transaction.receipt}</Link></td><td className="px-4 py-3.5 text-xs font-medium text-slate-700">{transaction.customer}</td><td className="px-4 py-3.5"><Badge>{transaction.method}</Badge></td><td className="px-4 py-3.5 text-xs text-slate-500">{transaction.time}</td><td className="px-5 py-3.5 text-right text-xs font-bold text-slate-900">{money.format(transaction.total)}</td></tr>
                ))}
              </tbody>
            </table>
            {!recentTransactions.length ? <p className="px-5 py-10 text-center text-xs text-slate-500">No transactions yet. Complete a sale to see it here.</p> : null}
          </div>
        </article> : null}

        {widgets.includes("bestSellers") ? <article className="rounded-xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
          <div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-bold text-slate-900">Best sellers</h2><p className="mt-0.5 text-xs text-slate-500">This month</p></div>
          <ol className="divide-y divide-slate-100 px-5">
            {bestSellers.map((item, index) => (
              <li key={item.name} className="flex items-center gap-3 py-3.5"><span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{item.name}</p><p className="mt-0.5 text-[10px] text-slate-500">{item.sold} sold · {item.category}</p></div><p className="text-xs font-bold text-slate-800">{money.format(item.revenue)}</p></li>
            ))}
            {!bestSellers.length ? <li className="py-10 text-center text-xs text-slate-500">No sales data for this month yet.</li> : null}
          </ol>
        </article> : null}
      </section> : null}
    </div>
  );
}

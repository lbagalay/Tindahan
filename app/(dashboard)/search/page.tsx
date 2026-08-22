import Link from "next/link";
import { PackageSearch, ReceiptText, Search, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { moneyFor } from "@/lib/utils";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth(); if (!session?.user) redirect("/login");
  const query = (await searchParams).q?.trim() ?? "";
  const businessId = session.user.businessId;
  const settings = await prisma.businessSettings.findUnique({ where: { businessId }, select: { currency: true, templateId: true, enabledModules: true, featureFlags: true, terminology: true } });
  const platform = resolvePlatformConfig(settings);
  const money = moneyFor(settings?.currency);
  const [products, customers, transactions] = query ? await Promise.all([
    platform.modules.catalog ? prisma.product.findMany({ where: { businessId, AND: [templateCatalogScope(platform.templateId), { OR: [{ name: { contains: query, mode: "insensitive" } }, { sku: { contains: query, mode: "insensitive" } }, { category: { name: { contains: query, mode: "insensitive" } } }] }] }, include: { category: true }, orderBy: { name: "asc" }, take: 10 }) : Promise.resolve([]),
    platform.modules.customers ? prisma.customer.findMany({ where: { businessId, OR: [{ name: { contains: query, mode: "insensitive" } }, { phone: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] }, orderBy: { name: "asc" }, take: 10 }) : Promise.resolve([]),
    platform.modules.transactions ? prisma.transaction.findMany({ where: { businessId, OR: [{ receiptNumber: { contains: query, mode: "insensitive" } }, { customer: { name: { contains: query, mode: "insensitive" } } }] }, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 10 }) : Promise.resolve([]),
  ]) : [[], [], []];
  const totalResults = products.length + customers.length + transactions.length;

  return <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Workspace search" title={query ? `Results for “${query}”` : "Search your workspace"} description={query ? `${totalResults} matching result${totalResults === 1 ? "" : "s"} across enabled modules.` : `Find ${platform.terminology.products.toLowerCase()}, ${platform.terminology.customers.toLowerCase()}, and receipts from one place.`} />
    <form action="/search" method="get" className="relative mt-6"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={query} autoFocus placeholder={`Search ${platform.terminology.products.toLowerCase()}, ${platform.terminology.customers.toLowerCase()}, or receipts…`} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-12 pr-4 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></form>
    {!query ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Search className="mx-auto text-slate-300" size={28} /><p className="mt-3 text-sm font-bold text-slate-700">Enter a search term</p><p className="mt-1 text-xs text-slate-500">You can search by name, SKU, contact details, or receipt number.</p></div> : totalResults === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><p className="text-sm font-bold text-slate-700">No results found</p><p className="mt-1 text-xs text-slate-500">Check the spelling or try a shorter search term.</p></div> : <div className="mt-5 space-y-4">
      {products.length ? <ResultSection title="Products & services" icon={PackageSearch} href={`/products?query=${encodeURIComponent(query)}`} linkLabel="View catalog">{products.map((item) => <Link key={item.id} href={`/products?query=${encodeURIComponent(item.sku)}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="text-xs font-bold text-slate-800">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.sku} · {item.category?.name ?? "Uncategorized"}</p></div><div className="text-right"><p className="text-xs font-bold">{money.format(Number(item.price))}</p><Badge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{item.status === "ACTIVE" ? "Active" : "Inactive"}</Badge></div></Link>)}</ResultSection> : null}
      {customers.length ? <ResultSection title="Customers" icon={Users} href={`/customers?query=${encodeURIComponent(query)}`} linkLabel="View customers">{customers.map((customer) => <Link key={customer.id} href={`/customers?query=${encodeURIComponent(customer.name)}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="text-xs font-bold text-slate-800">{customer.name}</p><p className="mt-1 text-[10px] text-slate-400">{customer.phone || "No phone"}</p></div><p className="text-xs text-slate-500">{customer.email || "No email"}</p></Link>)}</ResultSection> : null}
      {transactions.length ? <ResultSection title="Transactions" icon={ReceiptText} href="/transactions" linkLabel="View transactions">{transactions.map((transaction) => <Link key={transaction.id} href={`/transactions/${transaction.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="text-xs font-bold text-[var(--brand)]">{transaction.receiptNumber}</p><p className="mt-1 text-[10px] text-slate-400">{transaction.customer?.name ?? "Walk-in customer"} · {transaction.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })}</p></div><p className="text-xs font-bold">{money.format(Number(transaction.total))}</p></Link>)}</ResultSection> : null}
    </div>}
  </div>;
}

function ResultSection({ title, icon: Icon, href, linkLabel, children }: { title: string; icon: React.ElementType; href: string; linkLabel: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"><header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Icon size={17} className="text-[var(--brand)]" /> {title}</h2><Link href={href} className="text-xs font-bold text-[var(--brand)] hover:underline">{linkLabel}</Link></header><div className="divide-y divide-slate-100">{children}</div></section>;
}

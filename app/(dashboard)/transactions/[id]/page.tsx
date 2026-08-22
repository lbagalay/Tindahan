import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PrintReceiptButton } from "@/components/transactions/print-receipt-button";
import { moneyFor } from "@/lib/utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReceiptBrand } from "@/components/transactions/receipt-brand";
import { getBusinessPlatformConfig } from "@/lib/platform-config.server";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const platform = await getBusinessPlatformConfig(session.user.businessId);
  if (!platform.modules.transactions) redirect(session.user.role === "OWNER" ? "/settings" : "/");

  const record = await prisma.transaction.findFirst({
    where: { id, businessId: session.user.businessId },
    include: {
      customer: true,
      staff: true,
      items: true,
      payments: { take: 1 },
      business: { include: { settings: true } },
    },
  });
  if (!record) notFound();

  const payment = record.payments[0];
  const settings = record.business.settings;
  const detailedReceipt = settings?.receiptLayout !== "COMPACT";
  const customerName = record.customer?.name ?? "Walk-in customer";
  const date = record.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  const time = record.createdAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  const method = payment?.method === "GCASH" ? "GCash" : payment?.method.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) ?? "Other";
  const status = record.status.toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
  const statusTone = record.status === "COMPLETED" ? "success" : record.status === "REFUNDED" ? "warning" : "danger";
  const items = record.items.map((item) => ({ name: item.name, sku: item.sku, qty: item.quantity, price: Number(item.unitPrice), lineTotal: Number(item.lineTotal) }));
  const subtotal = Number(record.subtotal);
  const discount = Number(record.discount);
  const tax = Number(record.tax);
  const total = Number(record.total);
  const amountReceived = Number(payment?.amountReceived ?? total);
  const paymentChange = Number(payment?.change ?? 0);
  const taxPercentage = Number(settings?.taxPercentage ?? 0);
  const money = moneyFor(settings?.currency);

  return (
    <div className="receipt-page mx-auto max-w-5xl">
      <div className="no-print mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/transactions" className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[var(--brand)]"><ArrowLeft size={14} /> Back to {platform.terminology.transactions.toLowerCase()}</Link>
          <div className="flex items-center gap-3"><h1 className="text-2xl font-bold tracking-tight text-slate-950">{record.receiptNumber}</h1><Badge tone={statusTone}>{status}</Badge></div>
          <p className="mt-1 text-sm text-slate-500">{date} at {time}</p>
        </div>
        <PrintReceiptButton />
      </div>

      <div className="print-only hidden pb-5 text-center">
        <ReceiptBrand logo={settings?.logo ?? ""} brandName={record.business.name} compact={!detailedReceipt} />
        {detailedReceipt && settings?.address ? <p className="mt-1 text-[11px] leading-4">{settings.address}</p> : null}
        {detailedReceipt && settings?.phone ? <p className="text-[11px] leading-4">{settings.phone}</p> : null}
        <div className="my-4 border-t border-dashed border-slate-400" />
        <p className="text-sm font-bold">{record.receiptNumber}</p>
        <p className="mt-1 text-[11px]">{date} at {time}</p>
      </div>

      <div className="receipt-layout grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="receipt-card overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <div className="no-print border-b border-[var(--border)] px-5 py-4"><h2 className="font-bold text-slate-900">Sale items</h2></div>
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Item</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Price</th><th className="px-5 py-3 text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.sku}><td className="px-5 py-4"><p className="text-xs font-bold text-slate-800">{item.name}</p>{detailedReceipt ? <p className="mt-1 text-[10px] text-slate-400">{item.sku}</p> : null}</td><td className="px-4 py-4 text-right text-xs">{item.qty}</td><td className="px-4 py-4 text-right text-xs text-slate-600">{money.format(item.price)}</td><td className="px-5 py-4 text-right text-xs font-bold">{money.format(item.lineTotal)}</td></tr>)}</tbody>
          </table>
          <div className="border-t border-[var(--border)] bg-slate-50 px-5 py-5">
            <div className="ml-auto max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{money.format(subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Discount</span><span>− {money.format(discount)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Tax ({taxPercentage}%)</span><span>{money.format(tax)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-950"><span>Total paid</span><span>{money.format(total)}</span></div>
            </div>
          </div>
        </section>

        <aside className="receipt-aside space-y-4">
          {detailedReceipt ? <div className="receipt-card rounded-xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment</h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Method</span><Badge>{method}</Badge></div>
              {payment?.reference ? <div className="flex justify-between gap-4"><span className="text-slate-500">Reference</span><span className="break-all text-right font-bold">{payment.reference}</span></div> : null}
              <div className="flex justify-between"><span className="text-slate-500">Amount received</span><span className="font-bold">{money.format(amountReceived)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Change</span><span className="font-bold">{money.format(paymentChange)}</span></div>
            </div>
          </div> : null}
          <div className="receipt-card rounded-xl border border-[var(--border)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{platform.terminology.customer} & {platform.terminology.staff}</h2>
            <div className="mt-4 flex items-center gap-3"><span className="no-print grid size-9 place-items-center rounded-full bg-emerald-100 text-emerald-700"><UserRound size={17} /></span><div><p className="text-xs font-bold">{customerName}</p>{record.customer?.phone ? <p className="mt-0.5 text-[10px] text-slate-400">{record.customer.phone}</p> : <p className="mt-0.5 text-[10px] text-slate-400">Customer</p>}</div></div>
            <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-[10px] text-slate-400">Processed by</p><p className="mt-1 text-xs font-bold text-slate-700">{record.staff.name}</p></div>
          </div>
        </aside>
      </div>

      {settings?.receiptFooter ? <p className="print-only mt-5 hidden border-t border-dashed border-slate-400 pt-4 text-center text-[11px] leading-5">{settings.receiptFooter}</p> : null}
    </div>
  );
}

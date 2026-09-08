"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Minus, Plus, Printer, Search, ShoppingCart, Trash2, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoProducts, type DemoProduct } from "@/lib/demo-data";
import { currencySymbol, moneyFor } from "@/lib/utils";
import { completeSale as persistSale } from "@/app/actions/sales";
import { ReceiptBrand } from "@/components/transactions/receipt-brand";
import { defaultTerminology, type Terminology } from "@/lib/platform-config";

type CartLine = DemoProduct & { quantity: number };
type PaymentMethod = "Cash" | "GCash";
export type PosCustomer = { id: string; name: string; phone: string | null; transactions: number };
export type PosBusiness = { name: string; logo: string; address: string; phone: string; currency: string; taxPercentage: number; receiptFooter: string; cashierName: string; receiptLayout: "COMPACT" | "DETAILED" };

export function PosWorkspace({ initialProducts = demoProducts, initialCustomers = [], business, terminology = defaultTerminology }: { initialProducts?: DemoProduct[]; initialCustomers?: PosCustomer[]; business: PosBusiness; terminology?: Terminology }) {
  const money = moneyFor(business.currency);
  const symbol = currencySymbol(business.currency);
  const detailedReceipt = business.receiptLayout === "DETAILED";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All items");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [amountReceived, setAmountReceived] = useState(1500);
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const selectedCustomer = initialCustomers.find((item) => item.id === selectedCustomerId) ?? null;
  const customerName = selectedCustomer?.name ?? `Walk-in ${terminology.customer.toLowerCase()}`;
  const customerOptions = initialCustomers.filter((item) => `${item.name} ${item.phone ?? ""}`.toLowerCase().includes(customerQuery.toLowerCase()));
  const categories = useMemo(() => ["All items", ...Array.from(new Set(initialProducts.map((item) => item.category))).sort()], [initialProducts]);

  const filtered = useMemo(
    () => initialProducts.filter((item) => (category === "All items" || item.category === category) && `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase())),
    [category, initialProducts, query],
  );
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discountAmount = Math.min(discount, subtotal);
  const taxable = subtotal - discountAmount;
  const tax = taxable * (business.taxPercentage / 100);
  const total = taxable + tax;
  const change = Math.max(0, amountReceived - total);

  function addItem(product: DemoProduct) {
    if (product.type === "PRODUCT" && product.stock === 0) return;
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) return current.map((line) => line.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.type === "PRODUCT" ? product.stock : 99) } : line);
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(id: string, delta: number) {
    setCart((current) => current.map((line) => line.id === id ? { ...line, quantity: Math.max(1, Math.min(line.quantity + delta, line.type === "PRODUCT" ? line.stock : 99)) } : line));
  }

  async function completeSale() {
    setSaving(true); setCheckoutError("");
    const result = await persistSale({
      customerId: selectedCustomerId,
      discount,
      paymentMethod: paymentMethod.toUpperCase() as "CASH" | "GCASH",
      amountReceived: paymentMethod === "Cash" ? amountReceived : total,
      reference: paymentReference.trim() || undefined,
      items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
    });
    setSaving(false);
    if (!result.ok) { setCheckoutError(result.error); return; }
    setReceiptNumber(result.receiptNumber); setTransactionId(result.transactionId); setCheckoutOpen(false); setReceiptOpen(true); router.refresh();
  }

  function newSale() {
    setReceiptOpen(false);
    setCart([]);
    setSelectedCustomerId(null);
    setDiscount(0);
    setAmountReceived(0);
    setPaymentReference("");
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-72px)] flex-col bg-[#f6f7f8] sm:-m-6 lg:-m-8 xl:flex-row">
      <section className="min-w-0 flex-1 border-r border-[var(--border)] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">Cashier workspace</p><h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{terminology.pointOfSale}</h1></div>
          <div className="flex items-center gap-2 text-xs text-slate-500"><span className="size-2 rounded-full bg-emerald-500" /> Register online <span className="text-slate-300">·</span> {business.cashierName}</div>
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder={`Search ${terminology.products.toLowerCase()}, ${terminology.services.toLowerCase()}, or SKU…`} className="h-12 w-full rounded-lg border border-[var(--border)] bg-white pl-11 pr-4 text-sm shadow-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${category === item ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-white text-slate-600 hover:border-slate-400"}`}>{item}</button>)}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((product) => {
            const unavailable = product.type === "PRODUCT" && product.stock === 0;
            return (
              <button key={product.id} disabled={unavailable} onClick={() => addItem(product)} className="group min-h-[154px] rounded-xl border border-[var(--border)] bg-white p-3 text-left shadow-[0_1px_2px_rgba(16,24,20,0.03)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0">
                <div className="flex items-start justify-between gap-2"><span className={`grid size-11 place-items-center rounded-lg bg-cover bg-center text-xs font-bold ${product.accent}`} style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}>{product.image ? <span className="sr-only">{product.name}</span> : product.short}</span><Badge tone={product.type === "SERVICE" ? "info" : product.stock <= product.threshold ? "warning" : "neutral"}>{product.type === "SERVICE" ? "Service" : `${product.stock} in stock`}</Badge></div>
                <p className="mt-3 line-clamp-2 min-h-9 text-xs font-bold leading-4 text-slate-800">{product.name}</p>
                <div className="mt-2 flex items-end justify-between"><p className="text-sm font-extrabold text-slate-950">{money.format(product.price)}</p><Plus size={17} className="text-[var(--brand)] opacity-0 transition group-hover:opacity-100" /></div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col bg-white xl:sticky xl:top-[72px] xl:h-[calc(100vh-72px)] xl:w-[390px] 2xl:w-[430px]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div className="flex items-center gap-2"><ShoppingCart size={19} className="text-[var(--brand)]" /><h2 className="font-bold text-slate-900">Current order</h2><Badge>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</Badge></div><button onClick={() => setCart([])} className="text-xs font-semibold text-slate-400 hover:text-red-600">Clear</button></div>
        <div className="relative border-b border-[var(--border)] p-4">
          <button onClick={() => setCustomerPickerOpen((current) => !current)} className="flex h-11 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-left"><span className="flex items-center gap-2.5"><span className="grid size-7 place-items-center rounded-full bg-[var(--brand-soft)] text-[10px] font-bold text-[var(--brand)]">{selectedCustomer ? selectedCustomer.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : <UserPlus size={14} />}</span><span><span className="block text-xs font-bold text-slate-700">{customerName}</span><span className="block text-[10px] text-slate-400">{selectedCustomer ? `${selectedCustomer.transactions} previous transaction${selectedCustomer.transactions === 1 ? "" : "s"}` : "Tap to attach customer"}</span></span></span><ChevronDown size={15} className="text-slate-400" /></button>
          {customerPickerOpen ? <div className="absolute left-4 right-4 top-[68px] z-30 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-xl"><div className="border-b border-[var(--border)] p-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} autoFocus placeholder="Search customer name or phone…" className="h-9 w-full rounded-lg border border-[var(--border)] bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)]" /></div></div><div className="max-h-56 overflow-y-auto p-1.5"><button onClick={() => { setSelectedCustomerId(null); setCustomerPickerOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"><span className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500"><UserPlus size={14} /></span><span><span className="block text-xs font-bold text-slate-700">Walk-in customer</span><span className="text-[10px] text-slate-400">No customer attached</span></span></button>{customerOptions.map((item) => <button key={item.id} onClick={() => { setSelectedCustomerId(item.id); setCustomerPickerOpen(false); setCustomerQuery(""); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--brand-soft)] ${selectedCustomerId === item.id ? "bg-[var(--brand-soft)]" : ""}`}><span className="grid size-8 place-items-center rounded-full bg-[var(--brand-soft)] text-[10px] font-bold text-[var(--brand)]">{item.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-700">{item.name}</span><span className="block text-[10px] text-slate-400">{item.phone ?? "No phone"} · {item.transactions} transaction{item.transactions === 1 ? "" : "s"}</span></span></button>)}</div></div> : null}
        </div>

        <div className="min-h-[220px] flex-1 divide-y divide-slate-100 overflow-y-auto px-4">
          {cart.length === 0 ? <div className="grid h-full min-h-[260px] place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><ShoppingCart size={21} /></span><p className="mt-3 text-sm font-bold text-slate-700">Your cart is empty</p><p className="mt-1 text-xs text-slate-400">Select an item to begin a sale.</p></div></div> : cart.map((line) => (
            <div key={line.id} className="py-4">
              <div className="flex items-start gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-cover bg-center text-[10px] font-bold ${line.accent}`} style={line.image ? { backgroundImage: `url(${line.image})` } : undefined}>{line.image ? <span className="sr-only">{line.name}</span> : line.short}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{line.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{money.format(line.price)} each</p></div><button onClick={() => setCart((current) => current.filter((item) => item.id !== line.id))} className="text-slate-300 hover:text-red-600"><Trash2 size={15} /></button></div>
              <div className="mt-3 flex items-center justify-between pl-12"><div className="flex items-center rounded-md border border-[var(--border)]"><button onClick={() => updateQuantity(line.id, -1)} className="grid size-7 place-items-center text-slate-500 hover:bg-slate-50"><Minus size={12} /></button><span className="grid h-7 min-w-8 place-items-center border-x border-[var(--border)] text-xs font-bold">{line.quantity}</span><button onClick={() => updateQuantity(line.id, 1)} className="grid size-7 place-items-center text-slate-500 hover:bg-slate-50"><Plus size={12} /></button></div><p className="text-sm font-bold text-slate-900">{money.format(line.price * line.quantity)}</p></div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] bg-slate-50/70 p-5">
          <div className="space-y-2.5 text-xs"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-700">{money.format(subtotal)}</span></div><div className="flex items-center justify-between text-slate-500"><span>Discount</span><label className="flex items-center gap-1"><span>− {symbol}</span><input type="number" min="0" max={subtotal} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} className="h-7 w-20 rounded border border-[var(--border)] bg-white px-2 text-right font-semibold text-slate-700 outline-none" /></label></div><div className="flex justify-between text-slate-500"><span>Tax ({business.taxPercentage}%)</span><span className="font-semibold text-slate-700">{money.format(tax)}</span></div></div>
          <div className="my-4 border-t border-dashed border-slate-300" />
          <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total due</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{money.format(total)}</p></div><p className="text-[10px] text-slate-400">VAT inclusive</p></div>
          <Button size="lg" disabled={!cart.length} onClick={() => { setAmountReceived(Math.ceil(total / 100) * 100); setCheckoutOpen(true); }} className="mt-4 w-full">Proceed to payment</Button>
        </div>
      </aside>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5"><div><h2 className="text-lg font-bold text-slate-950">Take payment</h2><p className="mt-1 text-xs text-slate-500">Choose how the customer will pay.</p></div><button onClick={() => setCheckoutOpen(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
            <div className="p-6">
              <div className="rounded-xl bg-[var(--sidebar)] p-5 text-white"><p className="text-xs font-semibold text-white/70">Amount due</p><p className="mt-1 text-3xl font-extrabold tracking-tight">{money.format(total)}</p></div>
              <p className="mb-2 mt-5 text-xs font-bold text-slate-700">Payment method</p>
              <div className="grid grid-cols-2 gap-2">{([{ value: "Cash", label: "Cash" }, { value: "GCash", label: "GCash / QR" }] as { value: PaymentMethod; label: string }[]).map(({ value, label }) => <button key={value} onClick={() => setPaymentMethod(value)} className={`h-11 rounded-lg border text-xs font-bold ${paymentMethod === value ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] ring-1 ring-[var(--brand)]" : "border-[var(--border)] text-slate-600"}`}>{label}</button>)}</div>
              {paymentMethod === "Cash" ? <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-slate-700">Amount received</span><div className="flex h-12 items-center rounded-lg border border-[var(--border)] px-4 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand-soft)]"><span className="font-bold text-slate-500">{symbol}</span><input type="number" min={total} value={amountReceived} onChange={(event) => setAmountReceived(Number(event.target.value))} className="h-full min-w-0 flex-1 px-2 text-lg font-bold outline-none" /></div></label> : <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-slate-700">Reference number <span className="font-normal text-slate-400">(optional)</span></span><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={100} placeholder="Enter payment reference" className="h-12 w-full rounded-lg border border-[var(--border)] px-4 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></label>}
              <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span className="text-xs font-bold text-slate-500">Change</span><span className="text-lg font-extrabold text-[var(--brand)]">{money.format(paymentMethod === "Cash" ? change : 0)}</span></div>
              {checkoutError ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{checkoutError}</p> : null}
              <Button size="lg" disabled={saving || (paymentMethod === "Cash" && amountReceived < total)} onClick={completeSale} className="mt-5 w-full"><Check size={18} /> {saving ? "Completing sale…" : "Complete transaction"}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {receiptOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="my-6 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 no-print"><div className="flex items-center gap-2 text-emerald-700"><span className="grid size-7 place-items-center rounded-full bg-emerald-100"><Check size={15} /></span><span className="text-sm font-bold">Payment successful</span></div><button onClick={newSale}><X size={19} className="text-slate-400" /></button></div>
            <div className="p-7 text-center"><ReceiptBrand logo={business.logo} brandName={business.name} compact={!detailedReceipt} />{detailedReceipt ? <p className="mt-1 text-[11px] leading-5 text-slate-500">{business.address}<br />{business.phone}</p> : null}<div className="my-5 border-t border-dashed border-slate-300" /><div className="grid grid-cols-2 gap-y-2 text-left text-[11px]"><span className="text-slate-400">Receipt</span><span className="text-right font-bold">{receiptNumber}</span><span className="text-slate-400">Date</span><span className="text-right">{new Date().toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>{detailedReceipt ? <><span className="text-slate-400">Cashier</span><span className="text-right">{business.cashierName}</span><span className="text-slate-400">Customer</span><span className="text-right">{customerName}</span></> : null}</div><div className="my-5 border-t border-dashed border-slate-300" /><div className="space-y-3 text-left">{cart.map((line) => <div key={line.id} className="flex items-start justify-between gap-4 text-xs"><div><p className="font-bold text-slate-800">{line.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{line.quantity} × {money.format(line.price)}</p></div><p className="font-bold">{money.format(line.quantity * line.price)}</p></div>)}</div><div className="my-5 border-t border-dashed border-slate-300" /><div className="space-y-2 text-xs"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{money.format(subtotal)}</span></div><div className="flex justify-between text-slate-500"><span>Discount</span><span>− {money.format(discountAmount)}</span></div><div className="flex justify-between text-slate-500"><span>Tax ({business.taxPercentage}%)</span><span>{money.format(tax)}</span></div><div className="flex justify-between pt-2 text-base font-extrabold text-slate-950"><span>Total</span><span>{money.format(total)}</span></div><div className="flex justify-between text-slate-500"><span>{paymentMethod}</span><span>{money.format(paymentMethod === "Cash" ? amountReceived : total)}</span></div>{paymentReference && paymentMethod !== "Cash" ? <div className="flex justify-between gap-4 text-slate-500"><span>Reference</span><span className="break-all text-right">{paymentReference}</span></div> : null}{paymentMethod === "Cash" ? <div className="flex justify-between text-slate-500"><span>Change</span><span>{money.format(change)}</span></div> : null}</div><div className="my-5 border-t border-dashed border-slate-300" /><p className="text-[11px] leading-5 text-slate-500">{business.receiptFooter}</p></div>
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] p-4 no-print"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print receipt</Button><Button onClick={() => router.push(`/transactions/${transactionId}`)}>View transaction</Button><button onClick={newSale} className="col-span-2 text-xs font-bold text-slate-500 hover:text-[var(--brand)]">Start new sale</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, CloudOff, Minus, Plus, Printer, Search, ShoppingCart, Trash2, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoProducts, type DemoProduct } from "@/lib/demo-data";
import { currencySymbol, moneyFor, warmSwatchFor } from "@/lib/utils";
import { completeSale as persistSale, type SaleInput } from "@/app/actions/sales";
import { ReceiptBrand } from "@/components/transactions/receipt-brand";
import { defaultTerminology, type Terminology } from "@/lib/platform-config";
import { cacheCatalog, clearCartDraft, getCartDraft, getPendingSales, queueOfflineSale, saveCartDraft } from "@/lib/offline-db";
import { notifyQueueChanged } from "@/components/pos/offline-sync-manager";

type CartLine = DemoProduct & { quantity: number };
type PaymentMethod = "Cash" | "GCash";
export type PosCustomer = { id: string; name: string; phone: string | null; transactions: number };
export type PosBusiness = { id: string; name: string; logo: string; address: string; phone: string; currency: string; taxPercentage: number; receiptFooter: string; cashierName: string; receiptLayout: "COMPACT" | "DETAILED" };

export function PosWorkspace({ initialProducts = demoProducts, initialCustomers = [], business, terminology = defaultTerminology }: { initialProducts?: DemoProduct[]; initialCustomers?: PosCustomer[]; business: PosBusiness; terminology?: Terminology }) {
  const money = moneyFor(business.currency);
  const symbol = currencySymbol(business.currency);
  const detailedReceipt = business.receiptLayout === "DETAILED";
  const router = useRouter();
  const [products, setProducts] = useState<DemoProduct[]>(initialProducts);
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
  // Kept as the raw typed string, not a number, so React never fights the
  // browser's own number-input text (e.g. re-rendering "1" back as "01").
  const [amountReceivedInput, setAmountReceivedInput] = useState("1500");
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [pendingSync, setPendingSync] = useState(false);
  const [online, setOnline] = useState(true);
  const [cartRestored, setCartRestored] = useState(false);

  // Track connectivity so we can capture a sale locally instead of failing outright.
  useEffect(() => {
    setOnline(navigator.onLine);
    function goOnline() { setOnline(true); }
    function goOffline() { setOnline(false); }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  // Trust the fresh server catalog again once every offline sale has synced —
  // until then, keep the locally-decremented stock so a second offline sale
  // in the same outage can't oversell past what we already rang up.
  useEffect(() => {
    let cancelled = false;
    getPendingSales().then((pending) => { if (!cancelled && pending.length === 0) setProducts(initialProducts); });
    return () => { cancelled = true; };
  }, [initialProducts]);

  // Keep a client-side copy of the catalog so the counter can still price and
  // sell items if the shell is reloaded while offline.
  useEffect(() => { cacheCatalog(business.id, products); }, [business.id, products]);

  // Restore an in-progress cart after a reload or a dropped connection.
  useEffect(() => {
    let cancelled = false;
    getCartDraft(business.id).then((draft) => {
      if (cancelled || !draft) return;
      const draftCart = draft.cart as CartLine[];
      if (Array.isArray(draftCart) && draftCart.length) {
        setCart(draftCart);
        setSelectedCustomerId(draft.selectedCustomerId);
        setDiscount(draft.discount);
      }
      setCartRestored(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cartRestored) return; // don't overwrite a saved draft with the initial empty cart before we've tried restoring it
    if (cart.length === 0) { clearCartDraft(business.id); return; }
    saveCartDraft({ businessId: business.id, cart, selectedCustomerId, discount, savedAt: Date.now() });
  }, [cart, selectedCustomerId, discount, business.id, cartRestored]);

  const selectedCustomer = initialCustomers.find((item) => item.id === selectedCustomerId) ?? null;
  const customerName = selectedCustomer?.name ?? `Walk-in ${terminology.customer.toLowerCase()}`;
  const customerOptions = initialCustomers.filter((item) => `${item.name} ${item.phone ?? ""}`.toLowerCase().includes(customerQuery.toLowerCase()));
  const categories = useMemo(() => ["All items", ...Array.from(new Set(products.map((item) => item.category))).sort()], [products]);

  const filtered = useMemo(
    () => products.filter((item) => (category === "All items" || item.category === category) && `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase())),
    [category, products, query],
  );
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discountAmount = Math.min(Math.max(discount, 0), subtotal);
  const taxable = subtotal - discountAmount;
  // Prices already include VAT, so tax is the portion of the taxable amount already
  // baked in (taxable * rate / (100 + rate)) — the total charged is the taxable
  // amount itself, not taxable + tax on top.
  const tax = taxable * (business.taxPercentage / (100 + business.taxPercentage));
  const total = taxable;
  const amountReceived = Number(amountReceivedInput) || 0;
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

  function applyLocalStockDecrement() {
    setProducts((current) => current.map((product) => {
      const line = cart.find((item) => item.id === product.id);
      if (!line || product.type !== "PRODUCT") return product;
      return { ...product, stock: Math.max(0, product.stock - line.quantity) };
    }));
  }

  async function completeSale() {
    setSaving(true); setCheckoutError("");
    const clientTransactionId = crypto.randomUUID();
    const payload: SaleInput = {
      customerId: selectedCustomerId,
      discount,
      paymentMethod: paymentMethod.toUpperCase() as "CASH" | "GCASH",
      amountReceived: paymentMethod === "Cash" ? amountReceived : total,
      reference: paymentReference.trim() || undefined,
      items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      clientTransactionId,
    };
    try {
      if (online) {
        try {
          const result = await persistSale(payload);
          if (!result.ok) { setCheckoutError(result.error); return; }
          applyLocalStockDecrement();
          setReceiptNumber(result.receiptNumber); setTransactionId(result.transactionId); setPendingSync(false);
          setCheckoutOpen(false); setReceiptOpen(true);
          await clearCartDraft(business.id);
          router.refresh();
          return;
        } catch {
          // navigator said online but the request itself failed (flaky wifi) — capture it offline below rather than losing the sale
        }
      }
      await queueOfflineSale({
        clientTransactionId,
        businessId: business.id,
        payload,
        display: {
          items: cart.map((line) => ({ name: line.name, quantity: line.quantity, price: line.price })),
          subtotal, discount: discountAmount, tax, total, paymentMethod, amountReceived: paymentMethod === "Cash" ? amountReceived : total, customerName,
        },
        createdAt: Date.now(),
      });
      notifyQueueChanged();
      applyLocalStockDecrement();
      setReceiptNumber(`PENDING-${clientTransactionId.slice(0, 8).toUpperCase()}`);
      setTransactionId(""); setPendingSync(true);
      setCheckoutOpen(false); setReceiptOpen(true);
      await clearCartDraft(business.id);
    } catch {
      setCheckoutError("Couldn't complete this sale. Check your connection and try again — nothing was charged twice.");
    } finally {
      setSaving(false);
    }
  }

  function newSale() {
    setReceiptOpen(false);
    setCart([]);
    setSelectedCustomerId(null);
    setDiscount(0);
    setAmountReceivedInput("0");
    setPaymentReference("");
    setPendingSync(false);
  }

  return (
    <div className="pos-warm -m-4 flex min-h-[calc(100vh-72px)] flex-col sm:-m-6 lg:-m-8 xl:flex-row">
      <section className="min-w-0 flex-1 border-r border-[var(--pos-border)] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">Cashier workspace</p><h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--pos-ink)]">{terminology.pointOfSale}</h1></div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${online ? "border-[var(--pos-border)] bg-[var(--pos-surface)] text-[var(--pos-muted)]" : "border-amber-300 bg-amber-50 text-amber-800"}`}>{online ? <span className="size-2 rounded-full bg-emerald-500" /> : <CloudOff size={12} />} {online ? "Register online" : "Offline — sales save locally"} <span className="text-[var(--pos-border)]">·</span> {business.cashierName}</div>
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder={`Search ${terminology.products.toLowerCase()}, ${terminology.services.toLowerCase()}, or SKU…`} className="h-12 w-full rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface)] pl-11 pr-4 text-sm text-[var(--pos-ink)] shadow-sm outline-none placeholder:text-[var(--pos-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${category === item ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--pos-border)] bg-[var(--pos-surface)] text-[var(--pos-ink-soft)] hover:border-[var(--pos-muted)]"}`}>{item}</button>)}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((product) => {
            const unavailable = product.type === "PRODUCT" && product.stock === 0;
            const swatch = warmSwatchFor(product.category);
            return (
              <button key={product.id} disabled={unavailable} onClick={() => addItem(product)} className="group min-h-[164px] rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-3.5 text-left shadow-[0_2px_10px_rgba(120,90,50,0.07)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[0_6px_18px_rgba(120,90,50,0.12)] active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-11 place-items-center rounded-xl bg-cover bg-center text-xs font-bold" style={product.image ? { backgroundImage: `url(${product.image})` } : { backgroundColor: swatch.bg, color: swatch.fg }}>{product.image ? <span className="sr-only">{product.name}</span> : product.short}</span>
                  <Badge tone={product.type === "SERVICE" ? "info" : product.stock <= product.threshold ? "warning" : "neutral"}>{product.type === "SERVICE" ? "Service" : `${product.stock} in stock`}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 min-h-9 text-xs font-bold leading-4 text-[var(--pos-ink)]">{product.name}</p>
                <div className="mt-2.5 flex items-end justify-between">
                  <span className="rounded-md bg-[var(--pos-surface-alt)] px-2 py-1 font-mono text-[13px] font-extrabold tabular-nums text-[var(--pos-ink)]">{money.format(product.price)}</span>
                  <Plus size={17} className="text-[var(--brand)] opacity-0 transition group-hover:opacity-100" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col bg-[var(--pos-surface-alt)] xl:sticky xl:top-[72px] xl:h-[calc(100vh-72px)] xl:w-[390px] 2xl:w-[430px]">
        <div className="flex items-center justify-between border-b border-dashed border-[var(--pos-border)] px-5 py-4"><div className="flex items-center gap-2"><ShoppingCart size={19} className="text-[var(--brand)]" /><h2 className="font-display text-base font-semibold text-[var(--pos-ink)]">Current order</h2><Badge>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</Badge></div><button onClick={() => setCart([])} className="text-xs font-semibold text-[var(--pos-muted)] hover:text-red-600">Clear</button></div>
        <div className="relative border-b border-dashed border-[var(--pos-border)] p-4">
          <button onClick={() => setCustomerPickerOpen((current) => !current)} className="flex h-11 w-full items-center justify-between rounded-lg border border-[var(--pos-border)] bg-[var(--pos-surface)] px-3 text-left"><span className="flex items-center gap-2.5"><span className="grid size-7 place-items-center rounded-full bg-[var(--brand-soft)] text-[10px] font-bold text-[var(--brand)]">{selectedCustomer ? selectedCustomer.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : <UserPlus size={14} />}</span><span><span className="block text-xs font-bold text-[var(--pos-ink)]">{customerName}</span><span className="block text-[10px] text-[var(--pos-muted)]">{selectedCustomer ? `${selectedCustomer.transactions} previous transaction${selectedCustomer.transactions === 1 ? "" : "s"}` : "Tap to attach customer"}</span></span></span><ChevronDown size={15} className="text-[var(--pos-muted)]" /></button>
          {customerPickerOpen ? <div className="absolute left-4 right-4 top-[68px] z-30 overflow-hidden rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface)] shadow-xl"><div className="border-b border-[var(--pos-border)] p-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" /><input value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} autoFocus placeholder="Search customer name or phone…" className="h-9 w-full rounded-lg border border-[var(--pos-border)] bg-[var(--pos-surface-alt)] pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)]" /></div></div><div className="max-h-56 overflow-y-auto p-1.5"><button onClick={() => { setSelectedCustomerId(null); setCustomerPickerOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--pos-surface-alt)]"><span className="grid size-8 place-items-center rounded-full bg-[var(--pos-surface-alt)] text-[var(--pos-muted)]"><UserPlus size={14} /></span><span><span className="block text-xs font-bold text-[var(--pos-ink)]">Walk-in customer</span><span className="text-[10px] text-[var(--pos-muted)]">No customer attached</span></span></button>{customerOptions.map((item) => <button key={item.id} onClick={() => { setSelectedCustomerId(item.id); setCustomerPickerOpen(false); setCustomerQuery(""); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--brand-soft)] ${selectedCustomerId === item.id ? "bg-[var(--brand-soft)]" : ""}`}><span className="grid size-8 place-items-center rounded-full bg-[var(--brand-soft)] text-[10px] font-bold text-[var(--brand)]">{item.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-[var(--pos-ink)]">{item.name}</span><span className="block text-[10px] text-[var(--pos-muted)]">{item.phone ?? "No phone"} · {item.transactions} transaction{item.transactions === 1 ? "" : "s"}</span></span></button>)}</div></div> : null}
        </div>

        <div className="min-h-[220px] flex-1 divide-y divide-dashed divide-[var(--pos-border)] overflow-y-auto px-4">
          {cart.length === 0 ? <div className="grid h-full min-h-[260px] place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--pos-surface)] text-[var(--pos-muted)]"><ShoppingCart size={21} /></span><p className="mt-3 text-sm font-bold text-[var(--pos-ink)]">Your cart is empty</p><p className="mt-1 text-xs text-[var(--pos-muted)]">Select an item to begin a sale.</p></div></div> : cart.map((line) => {
            const swatch = warmSwatchFor(line.category);
            return (
            <div key={line.id} className="py-4">
              <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cover bg-center text-[10px] font-bold" style={line.image ? { backgroundImage: `url(${line.image})` } : { backgroundColor: swatch.bg, color: swatch.fg }}>{line.image ? <span className="sr-only">{line.name}</span> : line.short}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[var(--pos-ink)]">{line.name}</p><p className="mt-0.5 font-mono text-[10px] tabular-nums text-[var(--pos-muted)]">{money.format(line.price)} each</p></div><button onClick={() => setCart((current) => current.filter((item) => item.id !== line.id))} className="text-[var(--pos-border)] hover:text-red-600"><Trash2 size={15} /></button></div>
              <div className="mt-3 flex items-center justify-between pl-12"><div className="flex items-center rounded-md border border-[var(--pos-border)] bg-[var(--pos-surface)]"><button onClick={() => updateQuantity(line.id, -1)} className="grid size-7 place-items-center text-[var(--pos-ink-soft)] hover:bg-[var(--pos-surface-alt)]"><Minus size={12} /></button><span className="grid h-7 min-w-8 place-items-center border-x border-[var(--pos-border)] font-mono text-xs font-bold tabular-nums">{line.quantity}</span><button onClick={() => updateQuantity(line.id, 1)} className="grid size-7 place-items-center text-[var(--pos-ink-soft)] hover:bg-[var(--pos-surface-alt)]"><Plus size={12} /></button></div><p className="font-mono text-sm font-bold tabular-nums text-[var(--pos-ink)]">{money.format(line.price * line.quantity)}</p></div>
            </div>
            );
          })}
        </div>

        <div className="border-t border-dashed border-[var(--pos-border)] bg-[var(--pos-surface)]/60 p-5">
          <div className="space-y-2.5 font-mono text-xs tabular-nums"><div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">Subtotal</span><span className="font-semibold text-[var(--pos-ink-soft)]">{money.format(subtotal)}</span></div><div className="flex items-center justify-between text-[var(--pos-muted)]"><span className="font-sans">Discount</span><label className="flex items-center gap-1"><span>− {symbol}</span><input type="number" min="0" max={subtotal} value={discount} onChange={(event) => setDiscount(Math.min(Math.max(Number(event.target.value) || 0, 0), subtotal))} className="h-7 w-20 rounded border border-[var(--pos-border)] bg-[var(--pos-surface)] px-2 text-right font-semibold text-[var(--pos-ink-soft)] outline-none" /></label></div><div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">Tax ({business.taxPercentage}%)</span><span className="font-semibold text-[var(--pos-ink-soft)]">{money.format(tax)}</span></div></div>
          <div className="my-4 border-t border-dashed border-[var(--pos-border)]" />
          <div className="flex items-end justify-between"><div><p className="font-display text-xs font-semibold uppercase tracking-wider text-[var(--pos-muted)]">Total due</p><p className="mt-1 font-mono text-2xl font-extrabold tabular-nums tracking-tight text-[var(--pos-ink)]">{money.format(total)}</p></div><p className="text-[10px] text-[var(--pos-muted)]">VAT inclusive</p></div>
          <Button size="lg" disabled={!cart.length} onClick={() => { setAmountReceivedInput(String(Math.ceil(total / 100) * 100)); setCheckoutOpen(true); }} className="mt-4 w-full rounded-xl active:scale-[0.98]">Proceed to payment</Button>
        </div>
      </aside>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--pos-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--pos-border)] px-6 py-5"><div><h2 className="font-display text-lg font-semibold text-[var(--pos-ink)]">Take payment</h2><p className="mt-1 text-xs text-[var(--pos-muted)]">Choose how the customer will pay.</p></div><button onClick={() => setCheckoutOpen(false)} className="grid size-8 place-items-center rounded-lg text-[var(--pos-muted)] hover:bg-[var(--pos-surface-alt)]"><X size={19} /></button></div>
            <div className="p-6">
              {!online ? <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800"><CloudOff size={15} /> Offline — this sale will be saved on this device and synced automatically once you're back online.</div> : null}
              <div className="rounded-xl bg-[var(--sidebar)] p-5 text-white"><p className="text-xs font-semibold text-white/70">Amount due</p><p className="mt-1 font-mono text-3xl font-extrabold tabular-nums tracking-tight">{money.format(total)}</p></div>
              <p className="mb-2 mt-5 text-xs font-bold text-[var(--pos-ink-soft)]">Payment method</p>
              <div className="grid grid-cols-2 gap-2">{([{ value: "Cash", label: "Cash" }, { value: "GCash", label: "GCash / QR" }] as { value: PaymentMethod; label: string }[]).map(({ value, label }) => <button key={value} onClick={() => setPaymentMethod(value)} className={`h-11 rounded-lg border text-xs font-bold ${paymentMethod === value ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] ring-1 ring-[var(--brand)]" : "border-[var(--pos-border)] text-[var(--pos-ink-soft)]"}`}>{label}</button>)}</div>
              {paymentMethod === "Cash" ? <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-[var(--pos-ink-soft)]">Amount received</span><div className="flex h-12 items-center rounded-lg border border-[var(--pos-border)] px-4 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand-soft)]"><span className="font-bold text-[var(--pos-muted)]">{symbol}</span><input type="number" min={total} value={amountReceivedInput} onChange={(event) => setAmountReceivedInput(event.target.value)} onFocus={(event) => event.target.select()} className="h-full min-w-0 flex-1 px-2 font-mono text-lg font-bold tabular-nums outline-none" /></div></label> : <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-[var(--pos-ink-soft)]">Reference number <span className="font-normal text-[var(--pos-muted)]">(optional)</span></span><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={100} placeholder="Enter payment reference" className="h-12 w-full rounded-lg border border-[var(--pos-border)] px-4 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></label>}
              <div className="mt-5 flex items-center justify-between rounded-lg bg-[var(--pos-surface-alt)] px-4 py-3"><span className="text-xs font-bold text-[var(--pos-muted)]">Change</span><span className="font-mono text-lg font-extrabold tabular-nums text-[var(--brand)]">{money.format(paymentMethod === "Cash" ? change : 0)}</span></div>
              {checkoutError ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{checkoutError}</p> : null}
              <Button size="lg" disabled={saving || (paymentMethod === "Cash" && amountReceived < total)} onClick={completeSale} className="mt-5 w-full rounded-xl active:scale-[0.98]"><Check size={18} /> {saving ? "Completing sale…" : "Complete transaction"}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {receiptOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="my-6 w-full max-w-md rounded-2xl bg-[var(--pos-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--pos-border)] px-5 py-4 no-print"><div className={`flex items-center gap-2 ${pendingSync ? "text-amber-700" : "text-emerald-700"}`}><span className={`grid size-7 place-items-center rounded-full ${pendingSync ? "bg-amber-100" : "bg-emerald-100"}`}>{pendingSync ? <CloudOff size={15} /> : <Check size={15} />}</span><span className="text-sm font-bold">{pendingSync ? "Saved offline — pending sync" : "Payment successful"}</span></div><button onClick={newSale}><X size={19} className="text-[var(--pos-muted)]" /></button></div>
            <div className="p-7 text-center"><ReceiptBrand logo={business.logo} brandName={business.name} compact={!detailedReceipt} />{detailedReceipt ? <p className="mt-1 text-[11px] leading-5 text-[var(--pos-muted)]">{business.address}<br />{business.phone}</p> : null}<div className="my-5 border-t border-dashed border-[var(--pos-border)]" /><div className="grid grid-cols-2 gap-y-2 text-left text-[11px]"><span className="text-[var(--pos-muted)]">Receipt</span><span className="text-right font-mono font-bold">{receiptNumber}</span><span className="text-[var(--pos-muted)]">Date</span><span className="text-right">{new Date().toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>{detailedReceipt ? <><span className="text-[var(--pos-muted)]">Cashier</span><span className="text-right">{business.cashierName}</span><span className="text-[var(--pos-muted)]">Customer</span><span className="text-right">{customerName}</span></> : null}</div>{pendingSync ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-4 text-amber-800">This receipt number is temporary — it'll be replaced with the real one once this sale syncs to the server.</p> : null}<div className="my-5 border-t border-dashed border-[var(--pos-border)]" /><div className="space-y-3 text-left">{cart.map((line) => <div key={line.id} className="flex items-start justify-between gap-4 text-xs"><div><p className="font-bold text-[var(--pos-ink)]">{line.name}</p><p className="mt-0.5 text-[10px] text-[var(--pos-muted)]">{line.quantity} × {money.format(line.price)}</p></div><p className="font-mono font-bold tabular-nums">{money.format(line.quantity * line.price)}</p></div>)}</div><div className="my-5 border-t border-dashed border-[var(--pos-border)]" /><div className="space-y-2 font-mono text-xs tabular-nums"><div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">Subtotal</span><span>{money.format(subtotal)}</span></div><div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">Discount</span><span>− {money.format(discountAmount)}</span></div><div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">Tax ({business.taxPercentage}%)</span><span>{money.format(tax)}</span></div><div className="flex justify-between pt-2 text-base font-extrabold text-[var(--pos-ink)]"><span className="font-sans">Total</span><span>{money.format(total)}</span></div><div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">{paymentMethod}</span><span>{money.format(paymentMethod === "Cash" ? amountReceived : total)}</span></div>{paymentReference && paymentMethod !== "Cash" ? <div className="flex justify-between gap-4 text-[var(--pos-muted)]"><span className="font-sans">Reference</span><span className="break-all text-right">{paymentReference}</span></div> : null}{paymentMethod === "Cash" ? <div className="flex justify-between text-[var(--pos-muted)]"><span className="font-sans">Change</span><span>{money.format(change)}</span></div> : null}</div><div className="my-5 border-t border-dashed border-[var(--pos-border)]" /><p className="text-[11px] leading-5 text-[var(--pos-muted)]">{business.receiptFooter}</p></div>
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--pos-border)] p-4 no-print"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print receipt</Button>{pendingSync ? <Button disabled className="opacity-60">Syncing…</Button> : <Button onClick={() => router.push(`/transactions/${transactionId}`)}>View transaction</Button>}<button onClick={newSale} className="col-span-2 text-xs font-bold text-[var(--pos-muted)] hover:text-[var(--brand)]">Start new sale</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

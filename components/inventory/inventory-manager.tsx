"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Boxes, History, PackageCheck, TriangleAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoProducts, inventoryMovements, type DemoMovement, type DemoProduct } from "@/lib/demo-data";
import { moneyFor } from "@/lib/utils";
import { adjustInventory } from "@/app/actions/inventory";

export function InventoryManager({ initialProducts, initialMovements = inventoryMovements, initialMovementsToday = 0, currency = "PHP" }: { initialProducts?: DemoProduct[]; initialMovements?: DemoMovement[]; initialMovementsToday?: number; currency?: string }) {
  const money = moneyFor(currency);
  const initial = (initialProducts ?? demoProducts).filter((item) => item.type === "PRODUCT");
  const [products, setProducts] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"RESTOCK" | "ADJUSTMENT">("RESTOCK");
  const [error, setError] = useState("");
  const [movements, setMovements] = useState(initialMovements);
  const [movementsToday, setMovementsToday] = useState(initialMovementsToday);
  const inventoryValue = products.reduce((sum, item) => sum + item.cost * item.stock, 0);
  const lowStock = products.filter((item) => item.stock <= item.threshold).length;

  async function adjust(formData: FormData) {
    const quantity = Number(formData.get("quantity"));
    const delta = mode === "RESTOCK" ? quantity : -quantity;
    const result = await adjustInventory({ productId: selectedId, quantity: delta, reason: String(formData.get("reason")), type: mode });
    if (!result.ok) { setError(result.error ?? "Stock could not be updated."); return; }
    setProducts((current) => current.map((item) => item.id === selectedId ? { ...item, stock: Math.max(0, item.stock + (mode === "RESTOCK" ? quantity : -quantity)) } : item));
    if (result.movement) setMovements((current) => [result.movement, ...current].slice(0, 50));
    setMovementsToday((current) => current + 1);
    setError(""); setOpen(false);
  }

  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Inventory value" value={money.format(inventoryValue)} note="At current item cost" icon={Boxes} tone="bg-emerald-50 text-emerald-700" />
      <Metric label="Units on hand" value={String(products.reduce((sum, item) => sum + item.stock, 0))} note={`${products.length} tracked products`} icon={PackageCheck} tone="bg-blue-50 text-blue-700" />
      <Metric label="Low-stock items" value={String(lowStock)} note="At or below threshold" icon={TriangleAlert} tone="bg-amber-50 text-amber-700" />
      <Metric label="Movements today" value={String(movementsToday)} note="Sales, restocks, and adjustments" icon={History} tone="bg-violet-50 text-violet-700" />
    </section>

    <section className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Stock levels</h2><p className="mt-1 text-xs text-slate-500">Physical products with current availability.</p></div><Button onClick={() => { setMode("RESTOCK"); setOpen(true); }}><ArrowDown size={16} /> Add stock</Button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left"><thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3 font-bold">Product</th><th className="px-4 py-3 text-right font-bold">On hand</th><th className="px-4 py-3 text-right font-bold">Threshold</th><th className="px-4 py-3 text-right font-bold">Unit cost</th><th className="px-4 py-3 text-right font-bold">Stock value</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => { const low = product.stock <= product.threshold; return <tr key={product.id} className="hover:bg-slate-50/60"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-lg bg-cover bg-center text-[10px] font-bold ${product.accent}`} style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}>{product.image ? <span className="sr-only">{product.name}</span> : product.short}</span><div><p className="text-xs font-bold text-slate-800">{product.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{product.sku}</p></div></div></td><td className={`px-4 py-3.5 text-right text-sm font-bold ${low ? "text-amber-700" : "text-slate-800"}`}>{product.stock}</td><td className="px-4 py-3.5 text-right text-xs text-slate-500">{product.threshold}</td><td className="px-4 py-3.5 text-right text-xs text-slate-600">{money.format(product.cost)}</td><td className="px-4 py-3.5 text-right text-xs font-bold text-slate-700">{money.format(product.cost * product.stock)}</td><td className="px-5 py-3.5"><Badge tone={low ? "warning" : "success"}>{low ? "Low stock" : "Healthy"}</Badge></td><td className="px-5 py-3.5"><button onClick={() => { setSelectedId(product.id); setMode("ADJUSTMENT"); setOpen(true); }} className="text-xs font-bold text-[var(--brand)]">Adjust</button></td></tr>; })}</tbody></table></div>
    </section>

    <section className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-white"><div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-bold text-slate-900">Movement history</h2><p className="mt-1 text-xs text-slate-500">An audit trail of every inventory change.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3 font-bold">Product</th><th className="px-4 py-3 font-bold">Movement</th><th className="px-4 py-3 text-right font-bold">Change</th><th className="px-4 py-3 text-right font-bold">Before</th><th className="px-4 py-3 text-right font-bold">After</th><th className="px-4 py-3 font-bold">Recorded by</th><th className="px-5 py-3 text-right font-bold">Date & time</th></tr></thead><tbody className="divide-y divide-slate-100">{movements.map((movement) => <tr key={movement.id}><td className="px-5 py-3.5"><p className="text-xs font-bold text-slate-800">{movement.product}</p><p className="mt-0.5 text-[10px] text-slate-400">{movement.sku}</p></td><td className="px-4 py-3.5"><Badge tone={movement.type === "Sale" ? "info" : movement.type === "Restock" ? "success" : "warning"}>{movement.type}</Badge>{movement.reason ? <p className="mt-1 max-w-[220px] text-[10px] text-slate-400">{movement.reason}</p> : null}</td><td className={`px-4 py-3.5 text-right text-xs font-bold ${movement.change > 0 ? "text-emerald-700" : "text-slate-700"}`}>{movement.change > 0 ? "+" : ""}{movement.change}</td><td className="px-4 py-3.5 text-right text-xs text-slate-500">{movement.before}</td><td className="px-4 py-3.5 text-right text-xs font-bold text-slate-700">{movement.after}</td><td className="px-4 py-3.5 text-xs text-slate-600">{movement.by}</td><td className="px-5 py-3.5 text-right text-xs text-slate-500">{movement.time}</td></tr>)}</tbody></table></div>{!movements.length ? <div className="border-t border-[var(--border)] px-5 py-10 text-center text-xs text-slate-500">No inventory movements yet.</div> : null}</section>

    {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><form action={adjust} className="w-full max-w-md rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5"><div><h2 className="text-lg font-bold">{mode === "RESTOCK" ? "Add stock" : "Adjust stock"}</h2><p className="mt-1 text-xs text-slate-500">This creates a permanent inventory movement.</p></div><button type="button" onClick={() => setOpen(false)}><X size={19} className="text-slate-400" /></button></div><div className="space-y-4 p-6"><label><span className="mb-2 block text-xs font-bold text-slate-700">Product</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm">{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.stock} on hand)</option>)}</select></label><label><span className="mb-2 block text-xs font-bold text-slate-700">Quantity to {mode === "RESTOCK" ? "add" : "remove"}</span><input name="quantity" type="number" min="1" required className="h-11 w-full rounded-lg border border-[var(--border)] px-3 outline-none" /></label><label><span className="mb-2 block text-xs font-bold text-slate-700">Reason</span><textarea name="reason" required rows={3} placeholder={mode === "RESTOCK" ? "Supplier delivery" : "Damage, count correction, etc."} className="w-full resize-none rounded-lg border border-[var(--border)] p-3 text-sm outline-none" /></label>{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}</div><div className="flex justify-end gap-2 border-t border-[var(--border)] p-4"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{mode === "RESTOCK" ? <ArrowDown size={16} /> : <ArrowUp size={16} />} Record movement</Button></div></form></div> : null}
  </>;
}

function Metric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: React.ElementType; tone: string }) { return <article className="rounded-xl border border-[var(--border)] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p></div><span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon size={18} /></span></div><p className="mt-3 text-[11px] text-slate-500">{note}</p></article>; }

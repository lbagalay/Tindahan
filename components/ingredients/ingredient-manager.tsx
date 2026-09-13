"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Boxes, History, Plus, TriangleAlert, Wheat, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createIngredient, adjustIngredientStock, updateIngredient } from "@/app/actions/ingredients";

export type IngredientItem = { id: string; name: string; unit: string; stock: number; lowStockThreshold: number };
export type IngredientMovementItem = { id: string; ingredient: string; unit: string; type: string; change: number; before: number; after: number; by: string; time: string; reason?: string };

type ModalMode = "CREATE" | "EDIT" | "RESTOCK" | "ADJUSTMENT";

export function IngredientManager({ initialIngredients = [], initialMovements = [], initialMovementsToday = 0 }: { initialIngredients?: IngredientItem[]; initialMovements?: IngredientMovementItem[]; initialMovementsToday?: number; currency?: string }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [selectedId, setSelectedId] = useState(initialIngredients[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("CREATE");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [movements, setMovements] = useState(initialMovements);
  const [movementsToday, setMovementsToday] = useState(initialMovementsToday);
  const selected = ingredients.find((item) => item.id === selectedId) ?? null;
  const lowStock = ingredients.filter((item) => item.stock <= item.lowStockThreshold).length;

  function openCreate() { setMode("CREATE"); setError(""); setOpen(true); }
  function openEdit(id: string) { setSelectedId(id); setMode("EDIT"); setError(""); setOpen(true); }
  function openAdjust(id: string, adjustMode: "RESTOCK" | "ADJUSTMENT") { setSelectedId(id); setMode(adjustMode); setError(""); setOpen(true); }

  async function submit(formData: FormData) {
    setSaving(true); setError("");
    try {
      if (mode === "CREATE") {
        const result = await createIngredient({ name: String(formData.get("name")), unit: String(formData.get("unit")), stock: Number(formData.get("stock") || 0), lowStockThreshold: Number(formData.get("lowStockThreshold") || 0) });
        if (!result.ok) { setError(result.error); return; }
        setIngredients((current) => [...current, { id: result.id, name: String(formData.get("name")), unit: String(formData.get("unit")), stock: Number(formData.get("stock") || 0), lowStockThreshold: Number(formData.get("lowStockThreshold") || 0) }].sort((a, b) => a.name.localeCompare(b.name)));
        setOpen(false);
      } else if (mode === "EDIT" && selected) {
        const result = await updateIngredient({ id: selected.id, name: String(formData.get("name")), unit: String(formData.get("unit")), lowStockThreshold: Number(formData.get("lowStockThreshold") || 0) });
        if (!result.ok) { setError(result.error); return; }
        setIngredients((current) => current.map((item) => item.id === selected.id ? { ...item, name: String(formData.get("name")), unit: String(formData.get("unit")), lowStockThreshold: Number(formData.get("lowStockThreshold") || 0) } : item));
        setOpen(false);
      } else if (selected) {
        const quantity = Number(formData.get("quantity"));
        const result = await adjustIngredientStock({ ingredientId: selected.id, quantity: mode === "RESTOCK" ? quantity : -quantity, reason: String(formData.get("reason")), type: mode as "RESTOCK" | "ADJUSTMENT" });
        if (!result.ok) { setError(result.error ?? "Stock could not be updated."); return; }
        setIngredients((current) => current.map((item) => item.id === selected.id ? { ...item, stock: Math.max(0, item.stock + (mode === "RESTOCK" ? quantity : -quantity)) } : item));
        if (result.movement) setMovements((current) => [result.movement as unknown as IngredientMovementItem, ...current].slice(0, 50));
        setMovementsToday((current) => current + 1);
        setOpen(false);
      }
    } catch {
      setError("Connection lost while saving. Check your internet and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Metric label="Tracked ingredients" value={String(ingredients.length)} note="Raw materials on file" icon={Wheat} tone="bg-emerald-50 text-emerald-700" />
      <Metric label="Low-stock ingredients" value={String(lowStock)} note="At or below threshold" icon={TriangleAlert} tone="bg-amber-50 text-amber-700" />
      <Metric label="Movements today" value={String(movementsToday)} note="Sales, restocks, and adjustments" icon={History} tone="bg-violet-50 text-violet-700" />
    </section>

    <section className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display font-semibold text-[var(--foreground)]">Ingredient stock</h2><p className="mt-1 text-xs text-[var(--muted)]">Raw materials with current availability.</p></div><Button onClick={openCreate}><Plus size={16} /> Add ingredient</Button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--muted)]"><th className="px-5 py-3 font-bold">Ingredient</th><th className="px-4 py-3 text-right font-bold">On hand</th><th className="px-4 py-3 text-right font-bold">Threshold</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-dashed divide-[var(--border)]">{ingredients.map((item) => { const low = item.stock <= item.lowStockThreshold; return <tr key={item.id} className="hover:bg-[var(--surface-subtle)]/60"><td className="px-5 py-3.5"><p className="text-xs font-bold text-[var(--foreground)]">{item.name}</p></td><td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${low ? "text-amber-700" : "text-[var(--foreground)]"}`}>{item.stock} {item.unit}</td><td className="px-4 py-3.5 text-right text-xs tabular-nums text-[var(--muted)]">{item.lowStockThreshold} {item.unit}</td><td className="px-5 py-3.5"><Badge tone={low ? "warning" : "success"}>{low ? "Low stock" : "Healthy"}</Badge></td><td className="px-5 py-3.5"><div className="flex justify-end gap-3"><button onClick={() => openEdit(item.id)} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]">Edit</button><button onClick={() => openAdjust(item.id, "RESTOCK")} className="text-xs font-bold text-[var(--brand)]">Restock</button><button onClick={() => openAdjust(item.id, "ADJUSTMENT")} className="text-xs font-bold text-[var(--brand)]">Adjust</button></div></td></tr>; })}</tbody></table></div>
      {!ingredients.length ? <div className="px-5 py-10 text-center text-xs text-[var(--muted)]">No ingredients yet. Add coffee beans, milk, cups — anything your menu items are made from.</div> : null}
    </section>

    <section className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"><div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-display font-semibold text-[var(--foreground)]">Movement history</h2><p className="mt-1 text-xs text-[var(--muted)]">An audit trail of every ingredient change, including automatic deductions from sales.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--muted)]"><th className="px-5 py-3 font-bold">Ingredient</th><th className="px-4 py-3 font-bold">Movement</th><th className="px-4 py-3 text-right font-bold">Change</th><th className="px-4 py-3 text-right font-bold">Before</th><th className="px-4 py-3 text-right font-bold">After</th><th className="px-4 py-3 font-bold">Recorded by</th><th className="px-5 py-3 text-right font-bold">Date & time</th></tr></thead><tbody className="divide-y divide-dashed divide-[var(--border)]">{movements.map((movement) => <tr key={movement.id}><td className="px-5 py-3.5"><p className="text-xs font-bold text-[var(--foreground)]">{movement.ingredient}</p></td><td className="px-4 py-3.5"><Badge tone={movement.type === "Sale" ? "info" : movement.type === "Restock" ? "success" : "warning"}>{movement.type}</Badge>{movement.reason ? <p className="mt-1 max-w-[220px] text-[10px] text-[var(--muted)]">{movement.reason}</p> : null}</td><td className={`px-4 py-3.5 text-right text-xs font-bold tabular-nums ${movement.change > 0 ? "text-emerald-700" : "text-[var(--ink-soft)]"}`}>{movement.change > 0 ? "+" : ""}{movement.change} {movement.unit}</td><td className="px-4 py-3.5 text-right text-xs tabular-nums text-[var(--muted)]">{movement.before} {movement.unit}</td><td className="px-4 py-3.5 text-right text-xs font-bold tabular-nums text-[var(--ink-soft)]">{movement.after} {movement.unit}</td><td className="px-4 py-3.5 text-xs text-[var(--ink-soft)]">{movement.by}</td><td className="px-5 py-3.5 text-right text-xs text-[var(--muted)]">{movement.time}</td></tr>)}</tbody></table></div>{!movements.length ? <div className="border-t border-[var(--border)] px-5 py-10 text-center text-xs text-[var(--muted)]">No ingredient movements yet.</div> : null}</section>

    {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><form action={submit} className="w-full max-w-md rounded-2xl bg-[var(--surface)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5"><div><h2 className="font-display text-lg font-semibold text-[var(--foreground)]">{mode === "CREATE" ? "Add ingredient" : mode === "EDIT" ? "Edit ingredient" : mode === "RESTOCK" ? "Restock ingredient" : "Adjust ingredient"}</h2><p className="mt-1 text-xs text-[var(--muted)]">{mode === "CREATE" || mode === "EDIT" ? "Define the raw material and how it's measured." : "This creates a permanent stock movement."}</p></div><button type="button" onClick={() => setOpen(false)}><X size={19} className="text-[var(--muted)]" /></button></div>
      <div className="space-y-4 p-6">
        {mode === "CREATE" || mode === "EDIT" ? <>
          <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Name</span><input name="name" defaultValue={mode === "EDIT" ? selected?.name : ""} placeholder="e.g. Coffee beans" required className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Unit</span><input name="unit" defaultValue={mode === "EDIT" ? selected?.unit : ""} placeholder="g, ml, pc, kg" required className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none" /></label>
            <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Low-stock threshold</span><input name="lowStockThreshold" type="number" min="0" step="0.001" defaultValue={mode === "EDIT" ? selected?.lowStockThreshold : 0} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none" /></label>
          </div>
          {mode === "CREATE" ? <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Opening stock</span><input name="stock" type="number" min="0" step="0.001" defaultValue={0} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none" /></label> : <p className="text-[11px] leading-4 text-[var(--muted)]">Use Restock or Adjust to change stock so every change stays auditable.</p>}
        </> : <>
          <p className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2.5 text-xs font-bold text-[var(--foreground)]">{selected?.name} — {selected?.stock} {selected?.unit} on hand</p>
          <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Quantity to {mode === "RESTOCK" ? "add" : "remove"} ({selected?.unit})</span><input name="quantity" type="number" min="0.001" step="0.001" required className="h-11 w-full rounded-lg border border-[var(--border)] px-3 outline-none" /></label>
          <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Reason</span><textarea name="reason" required rows={3} placeholder={mode === "RESTOCK" ? "Supplier delivery" : "Spoilage, count correction, etc."} className="w-full resize-none rounded-lg border border-[var(--border)] p-3 text-sm outline-none" /></label>
        </>}
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-[var(--border)] p-4"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{mode === "RESTOCK" ? <ArrowDown size={16} /> : mode === "ADJUSTMENT" ? <ArrowUp size={16} /> : <Boxes size={16} />} {saving ? "Saving…" : mode === "CREATE" ? "Add ingredient" : mode === "EDIT" ? "Save changes" : "Record movement"}</Button></div>
    </form></div> : null}
  </>;
}

function Metric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: React.ElementType; tone: string }) { return <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">{value}</p></div><span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon size={18} /></span></div><p className="mt-3 text-[11px] text-[var(--muted)]">{note}</p></article>; }

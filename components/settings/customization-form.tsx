"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LayoutDashboard, Palette, Plus, ReceiptText, SlidersHorizontal, Trash2 } from "lucide-react";
import { updateCustomizationSettings } from "@/app/actions/management";
import { Button } from "@/components/ui/button";
import { dashboardWidgetKeys, type CustomFieldDefinition, type DashboardWidgetKey, type ReceiptLayout } from "@/lib/customization";

export type CustomizationValues = {
  workspaceName: string;
  workspaceTagline: string;
  brandColor: string;
  brandDarkColor: string;
  brandSoftColor: string;
  sidebarColor: string;
  receiptLayout: ReceiptLayout;
  dashboardWidgets: DashboardWidgetKey[];
  customerCustomFields: CustomFieldDefinition[];
  productCustomFields: CustomFieldDefinition[];
};

const widgetLabels: Record<DashboardWidgetKey, string> = { metrics: "Summary metrics", salesChart: "Sales chart", lowStock: "Low-stock panel", recentTransactions: "Recent transactions", bestSellers: "Best sellers" };

export function CustomizationForm({ initialValues }: { initialValues: CustomizationValues }) {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState(initialValues.workspaceName);
  const [workspaceTagline, setWorkspaceTagline] = useState(initialValues.workspaceTagline);
  const [brandColor, setBrandColor] = useState(initialValues.brandColor);
  const [brandDarkColor, setBrandDarkColor] = useState(initialValues.brandDarkColor);
  const [brandSoftColor, setBrandSoftColor] = useState(initialValues.brandSoftColor);
  const [sidebarColor, setSidebarColor] = useState(initialValues.sidebarColor);
  const [receiptLayout, setReceiptLayout] = useState(initialValues.receiptLayout);
  const [widgets, setWidgets] = useState(initialValues.dashboardWidgets);
  const [customerFields, setCustomerFields] = useState(initialValues.customerCustomFields);
  const [productFields, setProductFields] = useState(initialValues.productCustomFields);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true); setSaved(false);
    try {
      const result = await updateCustomizationSettings({
        workspaceName, workspaceTagline, brandColor, brandDarkColor, brandSoftColor, sidebarColor, receiptLayout, dashboardWidgets: widgets, customerCustomFields: customerFields, productCustomFields: productFields,
      });
      if (!result.ok) { setError(result.error); return; }
      setError(""); setSaved(true); router.refresh(); window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Connection lost while saving. Check your internet and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <form action={save} className="mt-8 space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">Workspace customization</p><h2 className="mt-1 text-xl font-bold text-slate-950">Brand, layout, and custom fields</h2><p className="mt-1 text-sm text-slate-500">Adapt the shared workspace without changing application code.</p></div>

    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"><SectionHeader icon={Palette} title="Brand identity" description="Customize the workspace label and core interface colors. This preview updates immediately; save to apply the theme to every page." /><div className="border-b border-[var(--border)] bg-slate-50 p-6"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 p-4 text-white" style={{ backgroundColor: sidebarColor }}><span className="size-9 overflow-hidden rounded-lg bg-white shadow-sm">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/tindahan-logo.png" alt="Tindahan logo" className="size-full scale-[3] object-contain" /></span><span><span className="block text-sm font-bold">{workspaceName || "Workspace name"}</span><span className="block text-[10px] uppercase tracking-[0.16em] text-white/65">{workspaceTagline || "Workspace tagline"}</span></span></div><div className="flex items-center justify-between gap-4 p-4"><span className="rounded-lg px-3 py-2 text-xs font-bold" style={{ backgroundColor: brandSoftColor, color: brandColor }}>Selected item</span><button type="button" className="rounded-lg px-4 py-2 text-xs font-bold text-white" style={{ backgroundColor: brandColor }}>Primary action</button></div></div></div><div className="grid gap-5 p-6 sm:grid-cols-2"><Field name="workspaceName" label="Workspace name (top of sidebar)" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} maxLength={40} required /><Field name="workspaceTagline" label="Workspace tagline" value={workspaceTagline} onChange={(event) => setWorkspaceTagline(event.target.value)} maxLength={60} required /><ColorField name="brandColor" label="Buttons and links" value={brandColor} onChange={setBrandColor} /><ColorField name="brandDarkColor" label="Button hover" value={brandDarkColor} onChange={setBrandDarkColor} /><ColorField name="brandSoftColor" label="Selected-item background" value={brandSoftColor} onChange={setBrandSoftColor} /><ColorField name="sidebarColor" label="Sidebar background" value={sidebarColor} onChange={setSidebarColor} /></div></section>

    <section className="rounded-xl border border-[var(--border)] bg-white"><SectionHeader icon={ReceiptText} title="Receipt layout" description="Choose the default presentation used for printable receipts." /><div className="grid gap-3 p-6 sm:grid-cols-2">{(["DETAILED", "COMPACT"] as ReceiptLayout[]).map((layout) => <label key={layout} className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border)] p-4 has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-soft)]"><input type="radio" name="receiptLayout" value={layout} checked={receiptLayout === layout} onChange={() => setReceiptLayout(layout)} className="mt-0.5 accent-[var(--brand)]" /><span><span className="block text-xs font-bold text-slate-800">{layout === "DETAILED" ? "Detailed receipt" : "Compact receipt"}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{layout === "DETAILED" ? "Includes customer, staff, payment details, and item SKUs." : "Optimized for short thermal-printer receipts."}</span></span></label>)}</div></section>

    <section className="rounded-xl border border-[var(--border)] bg-white"><SectionHeader icon={LayoutDashboard} title="Dashboard widgets" description="Choose which operational panels appear on the home dashboard." /><div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-3">{dashboardWidgetKeys.map((key) => <Toggle key={key} label={widgetLabels[key]} checked={widgets.includes(key)} onChange={(checked) => setWidgets((current) => checked ? [...current, key] : current.filter((item) => item !== key))} />)}</div></section>

    <section className="rounded-xl border border-[var(--border)] bg-white"><SectionHeader icon={SlidersHorizontal} title="Custom fields" description="Add client-specific information to customer and product records." /><div className="grid gap-6 p-6 xl:grid-cols-2"><CustomFieldEditor title="Customer fields" fields={customerFields} onChange={setCustomerFields} /><CustomFieldEditor title="Product fields" fields={productFields} onChange={setProductFields} /></div></section>

    <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-[var(--border)] bg-white/95 px-5 py-4 shadow-lg backdrop-blur">{error ? <span className="mr-auto text-xs font-semibold text-red-700">{error}</span> : saved ? <span className="mr-auto flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check size={15} /> Customization saved</span> : <span className="mr-auto text-xs text-slate-400">Theme changes apply after saving.</span>}<Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save customization"}</Button></div>
  </form>;
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) { return <div className="flex gap-3 border-b border-[var(--border)] px-6 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><Icon size={17} /></span><div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></div></div>; }
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label><span className="mb-2 block text-xs font-bold text-slate-700">{label}</span><input {...props} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></label>; }
function ColorField({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (value: string) => void }) { const validValue = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"; return <label><span className="mb-2 block text-xs font-bold text-slate-700">{label}</span><span className="flex h-11 items-center gap-3 rounded-lg border border-[var(--border)] px-3 focus-within:border-[var(--brand)]"><input type="color" aria-label={`${label} color picker`} value={validValue} onChange={(event) => onChange(event.target.value)} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" /><input name={name} aria-label={`${label} hex value`} value={value} onChange={(event) => onChange(event.target.value)} pattern="#[0-9a-fA-F]{6}" maxLength={7} required className="min-w-0 flex-1 bg-transparent font-mono text-xs text-slate-600 outline-none" /></span></label>; }
function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4"><span><span className="block text-xs font-bold text-slate-800">{label}</span>{description ? <span className="mt-1 block text-[11px] leading-4 text-slate-500">{description}</span> : null}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 shrink-0 accent-[var(--brand)]" /></label>; }

function CustomFieldEditor({ title, fields, onChange }: { title: string; fields: CustomFieldDefinition[]; onChange: (fields: CustomFieldDefinition[]) => void }) {
  function addField() { onChange([...fields, { id: crypto.randomUUID(), label: "", type: "text", required: false, options: [] }]); }
  return <div><div className="flex items-center justify-between"><h4 className="text-xs font-bold text-slate-800">{title}</h4><Button type="button" size="sm" variant="secondary" onClick={addField} disabled={fields.length >= 12}><Plus size={14} /> Add field</Button></div><div className="mt-3 space-y-3">{fields.map((field) => <div key={field.id} className="rounded-xl border border-[var(--border)] bg-slate-50 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_120px_32px]"><input value={field.label} onChange={(event) => onChange(fields.map((item) => item.id === field.id ? { ...item, label: event.target.value } : item))} placeholder="Field label" maxLength={60} className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-xs outline-none" /><select value={field.type} onChange={(event) => onChange(fields.map((item) => item.id === field.id ? { ...item, type: event.target.value as CustomFieldDefinition["type"] } : item))} className="h-9 rounded-lg border border-[var(--border)] bg-white px-2 text-xs"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Dropdown</option></select><button type="button" onClick={() => onChange(fields.filter((item) => item.id !== field.id))} aria-label={`Remove ${field.label || "field"}`} className="grid size-8 place-items-center text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div>{field.type === "select" ? <input value={field.options.join(", ")} onChange={(event) => onChange(fields.map((item) => item.id === field.id ? { ...item, options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean) } : item))} placeholder="Options separated by commas" className="mt-2 h-9 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-xs outline-none" /> : null}<label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600"><input type="checkbox" checked={field.required} onChange={(event) => onChange(fields.map((item) => item.id === field.id ? { ...item, required: event.target.checked } : item))} className="accent-[var(--brand)]" /> Required</label></div>)}{!fields.length ? <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500">No custom fields yet.</p> : null}</div></div>;
}

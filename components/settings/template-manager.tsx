"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LayoutTemplate, LockKeyhole, SlidersHorizontal, Tags } from "lucide-react";
import { applyBusinessTemplate, updatePlatformConfiguration } from "@/app/actions/platform";
import { Button } from "@/components/ui/button";
import {
  businessTemplateIds,
  businessTemplates,
  featureFlagKeys,
  moduleKeys,
  terminologyKeys,
  type BusinessTemplateId,
  type BusinessTemplate,
  type FeatureFlags,
  type ModuleSettings,
  type Terminology,
} from "@/lib/platform-config";

const moduleLabels: Record<(typeof moduleKeys)[number], string> = {
  dashboard: "Dashboard",
  pos: "Point of sale",
  catalog: "Catalog",
  inventory: "Inventory",
  ingredients: "Ingredients",
  customers: "Customers",
  transactions: "Transactions",
  reports: "Reports",
  appointments: "Appointments",
  jobOrders: "Job orders",
};

const featureLabels: Record<(typeof featureFlagKeys)[number], { label: string; description: string }> = {
  inventoryTracking: { label: "Inventory tracking", description: "Stock counts and auditable movements." },
  services: { label: "Service items", description: "Sell non-stock services in the catalog." },
  customerCRM: { label: "Customer records", description: "Contacts, purchase history, and custom fields." },
  appointments: { label: "Appointment workflow", description: "Scheduling capability for the appointment module." },
  jobOrders: { label: "Job-order workflow", description: "Work tracking capability for the job-order module." },
  variants: { label: "Product variants", description: "Configuration reserved for the variants workflow." },
  modifiers: { label: "Item modifiers", description: "Configuration reserved for menu add-ons and modifiers." },
  commissions: { label: "Commissions", description: "Configuration reserved for staff commission tracking." },
  vehicles: { label: "Vehicle records", description: "Configuration reserved for customer vehicle records." },
  serviceHistory: { label: "Service history", description: "Configuration reserved for asset service history." },
};

const terminologyLabels: Record<(typeof terminologyKeys)[number], string> = {
  catalog: "Catalog page",
  product: "Product (singular)",
  products: "Products (plural)",
  service: "Service (singular)",
  services: "Services (plural)",
  category: "Category (singular)",
  categories: "Categories (plural)",
  customer: "Customer (singular)",
  customers: "Customers (plural)",
  staff: "Staff",
  transaction: "Transaction (singular)",
  transactions: "Transactions (plural)",
  inventory: "Inventory",
  appointment: "Appointment (singular)",
  appointments: "Appointments (plural)",
  jobOrder: "Job order (singular)",
  jobOrders: "Job orders (plural)",
  pointOfSale: "Point of sale",
};

export type PlatformValues = { templateId: BusinessTemplateId; modules: ModuleSettings; features: FeatureFlags; terminology: Terminology };

export function TemplateManager({ initialValues, allowedTemplates, subscriptionPlan, subscriptionStatus }: { initialValues: PlatformValues; allowedTemplates: BusinessTemplateId[]; subscriptionPlan: string; subscriptionStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED" }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(initialValues.templateId);
  const [modules, setModules] = useState(initialValues.modules);
  const [features, setFeatures] = useState(initialValues.features);
  const [terminology, setTerminology] = useState(initialValues.terminology);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function applyTemplate(nextTemplateId: BusinessTemplateId) {
    if (!allowedTemplates.includes(nextTemplateId)) { setError("This template is not included in your subscription."); return; }
    setBusy(nextTemplateId); setError(""); setMessage("");
    try {
      const result = await applyBusinessTemplate({ templateId: nextTemplateId });
      if (!result.ok) { setError(result.error); return; }
      const template = businessTemplates[nextTemplateId];
      setTemplateId(nextTemplateId); setModules(template.modules); setFeatures(template.features); setTerminology(template.terminology);
      setMessage(`${template.name} applied across the workspace${template.sampleCatalog.length ? ` with ${template.sampleCatalog.length} template items` : ""}.`); router.refresh();
    } catch {
      setError("Connection lost while applying the template. Check your internet and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function saveConfiguration() {
    setBusy("configuration"); setError(""); setMessage("");
    try {
      const result = await updatePlatformConfiguration({ modules, features, terminology });
      if (!result.ok) { setError(result.error); return; }
      setMessage("Platform configuration saved across the workspace."); router.refresh();
    } catch {
      setError("Connection lost while saving. Check your internet and try again.");
    } finally {
      setBusy(null);
    }
  }

  return <div className="mt-8 space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">Business platform</p><h2 className="mt-1 font-display text-xl font-semibold text-[var(--foreground)]">Template, modules, and language</h2><p className="mt-1 text-sm text-[var(--muted)]">Configure the whole workspace from one shared platform. Applying a template never removes products, customers, transactions, or existing categories.</p></div>

    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <SectionHeader icon={LayoutTemplate} title="Business template" description="Only templates included in the active subscription can be applied." />
      <div className="mx-6 mt-5 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div><p className="text-xs font-bold text-emerald-900">{subscriptionPlan}</p><p className="mt-1 text-[11px] text-emerald-700">{allowedTemplates.length} template{allowedTemplates.length === 1 ? "" : "s"} included</p></div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${subscriptionStatus === "ACTIVE" ? "bg-emerald-700 text-white" : "bg-amber-100 text-amber-800"}`}>{subscriptionStatus.replace("_", " ")}</span>
      </div>
      <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
        {businessTemplateIds.map((id) => <TemplateCard key={id} template={businessTemplates[id]} active={templateId === id} locked={!allowedTemplates.includes(id) || subscriptionStatus !== "ACTIVE"} busy={busy} onApply={applyTemplate} />)}
      </div>
    </section>

    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <SectionHeader icon={SlidersHorizontal} title="Workspace modules" description="Enabled modules appear in navigation and their routes become available. Dashboard always remains enabled." />
      <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-3">{moduleKeys.map((key) => <Toggle key={key} label={moduleLabels[key]} checked={modules[key]} disabled={key === "dashboard"} onChange={(checked) => { setModules((current) => ({ ...current, [key]: checked })); if (key === "appointments" || key === "jobOrders") setFeatures((current) => ({ ...current, [key]: checked })); if (key === "inventory") setFeatures((current) => ({ ...current, inventoryTracking: checked })); }} />)}</div>
    </section>

    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <SectionHeader icon={SlidersHorizontal} title="Feature flags" description="Capabilities are stored independently from templates so workflows can evolve without business-type conditionals." />
      <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-3">{featureFlagKeys.map((key) => <Toggle key={key} label={featureLabels[key].label} description={featureLabels[key].description} checked={features[key]} disabled={(key === "appointments" && !modules.appointments) || (key === "jobOrders" && !modules.jobOrders) || (key === "inventoryTracking" && !modules.inventory)} onChange={(checked) => setFeatures((current) => ({ ...current, [key]: checked }))} />)}</div>
    </section>

    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <SectionHeader icon={Tags} title="Terminology" description="These labels are resolved from configuration and used throughout navigation and module pages." />
      <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">{terminologyKeys.map((key) => <label key={key}><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">{terminologyLabels[key]}</span><input value={terminology[key]} maxLength={40} onChange={(event) => setTerminology((current) => ({ ...current, [key]: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-xs outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></label>)}</div>
    </section>

    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 shadow-lg backdrop-blur">{error ? <span className="mr-auto text-xs font-semibold text-red-700">{error}</span> : message ? <span className="mr-auto flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check size={15} /> {message}</span> : <span className="mr-auto text-xs text-[var(--muted)]">Changes here apply to every page after saving.</span>}<Button type="button" disabled={busy !== null} onClick={saveConfiguration}>{busy === "configuration" ? "Saving…" : "Save platform configuration"}</Button></div>
  </div>;
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) { return <div className="flex gap-3 border-b border-[var(--border)] px-6 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><Icon size={17} /></span><div><h3 className="font-display font-semibold text-[var(--foreground)]">{title}</h3><p className="mt-1 text-xs text-[var(--muted)]">{description}</p></div></div>; }
function TemplateCard({ template, active, locked, busy, onApply }: { template: BusinessTemplate; active: boolean; locked: boolean; busy: string | null; onApply: (id: BusinessTemplateId) => Promise<void> }) { return <article className={`flex flex-col rounded-xl border p-4 ${active ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--border)]"} ${locked ? "bg-[var(--surface-subtle)]/70 opacity-70" : ""}`}><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-bold text-[var(--foreground)]">{template.name}</h4><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{template.description}</p></div>{active ? <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-1 text-[10px] font-bold text-[var(--brand)]"><Check size={12} /> Active</span> : locked ? <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--border)] px-2 py-1 text-[10px] font-bold text-[var(--ink-soft)]"><LockKeyhole size={11} /> Locked</span> : null}</div><div className="mt-3 rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-[10px] leading-5 text-[var(--muted)]"><span className="font-bold text-[var(--ink-soft)]">Example:</span> {template.examples.catalogItem}<br /><span className="font-mono">{template.examples.sku}</span> · {template.examples.category}</div><p className="mt-3 text-[10px] font-semibold text-[var(--muted)]">{template.sampleCatalog.length ? `${template.sampleCatalog.length} template items · ` : ""}{template.suggestedCategories.length ? `Adds missing categories: ${template.suggestedCategories.join(", ")}` : "No suggested categories are added."}</p><Button type="button" size="sm" variant={active ? "secondary" : "primary"} className="mt-4" disabled={busy !== null || locked} onClick={() => onApply(template.id)}>{locked ? "Not in subscription" : busy === template.id ? "Applying…" : active ? template.sampleCatalog.length ? "Refresh template menu" : "Reapply template" : "Apply template"}</Button></article>; }
function Toggle({ label, description, checked, disabled, onChange }: { label: string; description?: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) { return <label className={`flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4 ${disabled ? "cursor-not-allowed bg-[var(--surface-subtle)] opacity-65" : "cursor-pointer"}`}><span><span className="block text-xs font-bold text-[var(--foreground)]">{label}</span>{description ? <span className="mt-1 block text-[11px] leading-4 text-[var(--muted)]">{description}</span> : null}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="size-4 shrink-0 accent-[var(--brand)]" /></label>; }

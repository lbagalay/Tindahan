"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ImageUp, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBusinessSettings } from "@/app/actions/management";

export type SettingsValues = { businessName: string; businessType: string; phone: string; email: string; logo: string; currency: string; receiptPrefix: string; address: string; taxPercentage: number; receiptFooter: string };
type Currency = "PHP" | "USD" | "EUR" | "SGD" | "AUD" | "JPY";

export function SettingsForm({ initialValues }: { initialValues: SettingsValues }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState(initialValues.logo);
  const [saving, setSaving] = useState(false);
  const isTindahanLogo = logo.endsWith("/tindahan-logo.png");

  async function save(formData: FormData) {
    setSaving(true);
    try {
      const result = await updateBusinessSettings({
        businessName: String(formData.get("businessName")), businessType: String(formData.get("businessType")), phone: String(formData.get("phone")), email: String(formData.get("email")), logo: String(formData.get("logo")), currency: String(formData.get("currency")) as Currency, address: String(formData.get("address")), taxPercentage: Number(formData.get("taxPercentage")), receiptFooter: String(formData.get("receiptFooter")),
      });
      if (!result.ok) { setError(result.error); return; }
      setError(""); setSaved(true); router.refresh(); window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Connection lost while saving. Check your internet and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <form action={save} className="grid gap-5 xl:grid-cols-[220px_1fr]">
    <nav className="h-fit rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2"><SettingsLink href="#business-profile" icon={Building2} label="Business profile" /><SettingsLink href="#sales-receipt" icon={ReceiptText} label="Sales & receipt" /></nav>
    <div className="space-y-5">
      <section id="business-profile" className="scroll-mt-24 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-6 py-5"><h2 className="font-display font-semibold text-[var(--foreground)]">Business profile</h2><p className="mt-1 text-xs text-[var(--muted)]">Shown across the workspace and on printed receipts.</p></div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="mb-2 text-xs font-bold text-[var(--ink-soft)]">Business logo</p><div className="flex items-center gap-4"><span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--sidebar)] text-lg font-extrabold text-white">{logo ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={logo} alt="Business logo preview" className={isTindahanLogo ? "size-full scale-[3] object-contain" : "size-full object-cover"} /></> : initialValues.businessName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><label className="min-w-0 flex-1"><span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]"><ImageUp size={14} /> Logo URL or app path</span><input name="logo" type="text" value={logo} onChange={(event) => setLogo(event.target.value)} placeholder="https://example.com/logo.png or /logo.png" className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></label></div></div>
          <Field name="businessName" label="Business name" defaultValue={initialValues.businessName} className="sm:col-span-2" required />
          <Field name="businessType" label="Business type" defaultValue={initialValues.businessType} required />
          <Field name="phone" label="Phone" defaultValue={initialValues.phone} required />
          <Field name="email" label="Email" type="email" defaultValue={initialValues.email} />
          <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Currency</span><select name="currency" defaultValue={initialValues.currency} className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="PHP">PHP — Philippine Peso (₱)</option><option value="USD">USD — US Dollar ($)</option><option value="EUR">EUR — Euro (€)</option><option value="SGD">SGD — Singapore Dollar (S$)</option><option value="AUD">AUD — Australian Dollar (A$)</option><option value="JPY">JPY — Japanese Yen (¥)</option></select></label>
          <Field name="address" label="Business address" defaultValue={initialValues.address} className="sm:col-span-2" required />
        </div>
      </section>
      <section id="sales-receipt" className="scroll-mt-24 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-6 py-5"><h2 className="font-display font-semibold text-[var(--foreground)]">Tax & receipts</h2><p className="mt-1 text-xs text-[var(--muted)]">Default calculation and receipt information for checkout.</p></div>
        <div className="grid gap-5 p-6 sm:grid-cols-2"><Field name="taxPercentage" label="Tax percentage" type="number" min="0" max="100" step="0.01" defaultValue={initialValues.taxPercentage} required /><Field label="Receipt prefix" defaultValue={initialValues.receiptPrefix} readOnly /><label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Receipt footer</span><textarea name="receiptFooter" defaultValue={initialValues.receiptFooter} maxLength={300} rows={3} className="w-full resize-none rounded-lg border border-[var(--border)] p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>{error ? <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}</div>
      </section>
      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 shadow-lg backdrop-blur">{saved ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check size={15} /> Settings saved</span> : <span className="text-xs text-[var(--muted)]">Changes apply across the workspace.</span>}<Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
    </div>
  </form>;
}

function SettingsLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) { return <a href={href} className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"><Icon size={16} /> {label}</a>; }
function Field({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className={className}><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">{label}</span><input className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" {...props} /></label>; }

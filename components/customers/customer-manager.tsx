"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Mail, MoreHorizontal, Phone, Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoCustomers, type DemoCustomer } from "@/lib/demo-data";
import { moneyFor } from "@/lib/utils";
import { createCustomer as persistCustomer, updateCustomer } from "@/app/actions/management";
import type { CustomFieldDefinition } from "@/lib/customization";
import { defaultTemplateExamples, defaultTerminology, type TemplateExamples, type Terminology } from "@/lib/platform-config";

const CustomerExamplesContext = createContext(defaultTemplateExamples);

export function CustomerManager({ initialCustomers = demoCustomers, initialQuery = "", currency = "PHP", customFields = [], terminology = defaultTerminology, examples = defaultTemplateExamples }: { initialCustomers?: DemoCustomer[]; initialQuery?: string; currency?: string; customFields?: CustomFieldDefinition[]; terminology?: Terminology; examples?: TemplateExamples }) {
  const money = moneyFor(currency);
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DemoCustomer | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.email} ${customer.notes} ${Object.values(customer.customValues ?? {}).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [customers, query]);
  const returning = customers.filter((customer) => customer.transactions > 1).length;
  const purchaseTotal = customers.reduce((sum, customer) => sum + customer.total, 0);

  function openCreate() { setEditing(null); setError(""); setOpen(true); }
  function openEdit(customer: DemoCustomer) { setEditing(customer); setError(""); setOpen(true); }

  async function saveCustomer(formData: FormData) {
    const name = String(formData.get("name"));
    const phone = String(formData.get("phone"));
    const email = String(formData.get("email"));
    const notes = String(formData.get("notes"));
    const customValues = Object.fromEntries(customFields.map((field) => [field.id, String(formData.get(`custom:${field.id}`) ?? "")]));
    setSaving(true);
    const result = editing
      ? await updateCustomer({ id: editing.id, name, phone, email, notes, customValues })
      : await persistCustomer({ name, phone, email, notes, customValues });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    if (editing) {
      setCustomers((current) => current.map((customer) => customer.id === editing.id ? { ...customer, name, phone, email, notes, customValues, initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() } : customer));
    } else {
      if (!("id" in result) || typeof result.id !== "string") { setError("The customer was saved but could not be added to this view."); return; }
      setCustomers((current) => [{ id: result.id as string, name, phone, email, notes, customValues, transactions: 0, total: 0, last: "No purchases yet", initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() }, ...current]);
    }
    setError(""); setOpen(false); setEditing(null);
  }

  return <CustomerExamplesContext.Provider value={examples}><>
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label={`Registered ${terminology.customers.toLowerCase()}`} value={String(customers.length)} note="Current business records" />
      <Stat label={`Returning ${terminology.customers.toLowerCase()}`} value={`${customers.length ? Math.round(returning / customers.length * 100) : 0}%`} note={`${returning} with repeat visits`} />
      <Stat label={`Average ${terminology.customer.toLowerCase()} value`} value={money.format(customers.length ? purchaseTotal / customers.length : 0)} note="All-time purchase value" />
    </div>
    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${terminology.customers.toLowerCase()} — e.g. ${examples.customerName}`} aria-label={`Search ${terminology.customers}`} className="h-10 w-full rounded-lg border border-[var(--border)] bg-slate-50 pl-10 pr-3 text-xs outline-none focus:border-[var(--brand)] focus:bg-white" /></div><Button onClick={openCreate}><UserPlus size={16} /> Add {terminology.customer.toLowerCase()}</Button></div>
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[var(--border)] bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3 font-bold">Customer</th><th className="px-4 py-3 font-bold">Contact</th><th className="px-4 py-3 text-right font-bold">Transactions</th><th className="px-4 py-3 text-right font-bold">Total purchases</th><th className="px-4 py-3 text-right font-bold">Last purchase</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((customer) => <tr key={customer.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">{customer.initials}</span><div><p className="text-xs font-bold text-slate-800">{customer.name}</p>{customer.notes ? <p className="mt-1 max-w-[220px] truncate text-[10px] text-slate-400">{customer.notes}</p> : null}</div></div></td><td className="px-4 py-4"><p className="flex items-center gap-1.5 text-[11px] text-slate-600"><Phone size={12} /> {customer.phone || "No phone"}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400"><Mail size={12} /> {customer.email || "No email"}</p></td><td className="px-4 py-4 text-right text-xs font-bold text-slate-700">{customer.transactions}</td><td className="px-4 py-4 text-right text-xs font-bold text-slate-800">{money.format(customer.total)}</td><td className="px-4 py-4 text-right text-xs text-slate-500">{customer.last}</td><td className="px-5 py-4"><button onClick={() => openEdit(customer)} aria-label={`Edit ${customer.name}`} className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>{!filtered.length ? <div className="border-t border-[var(--border)] px-5 py-10 text-center text-xs text-slate-500">No customers match your search.</div> : null}<div className="border-t border-[var(--border)] px-5 py-3 text-[11px] text-slate-500">Showing {filtered.length} of {customers.length} customer records</div></div>
    {open ? <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4"><form key={editing?.id ?? "new"} action={saveCustomer} className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5"><div><h2 className="text-lg font-bold">{editing ? "Edit customer" : "Add customer"}</h2><p className="mt-1 text-xs text-slate-500">{editing ? "Update contact details and notes." : "Contact details help identify repeat visits."}</p></div><button type="button" onClick={() => setOpen(false)}><X size={19} className="text-slate-400" /></button></div><div className="space-y-4 p-6"><Field name="name" label="Full name" placeholder="Customer name" defaultValue={editing?.name} /><div className="grid gap-4 sm:grid-cols-2"><Field name="phone" label="Phone" placeholder="+63 9XX XXX XXXX" defaultValue={editing?.phone} required={false} /><Field name="email" type="email" label="Email" placeholder="name@email.com" defaultValue={editing?.email} required={false} /></div><label><span className="mb-2 block text-xs font-bold text-slate-700">Notes</span><textarea name="notes" rows={3} defaultValue={editing?.notes} placeholder="Preferences, reminders, or important context" className="w-full resize-none rounded-lg border border-[var(--border)] p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>{customFields.map((field) => <CustomInput key={field.id} field={field} defaultValue={editing?.customValues?.[field.id]} />)}{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}</div><div className="flex justify-end gap-2 border-t border-[var(--border)] p-4"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create customer"}</Button></div></form></div> : null}
  </></CustomerExamplesContext.Provider>;
}

function Field({ label, required = true, name, placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const examples = useContext(CustomerExamplesContext); return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">{label}</span><input name={name} placeholder={name === "name" ? examples.customerName : placeholder} required={required} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]" {...props} /></label>; }
function CustomInput({ field, defaultValue }: { field: CustomFieldDefinition; defaultValue?: string }) { return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">{field.label}</span>{field.type === "select" ? <select name={`custom:${field.id}`} defaultValue={defaultValue ?? ""} required={field.required} className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"><option value="">Select…</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input name={`custom:${field.id}`} type={field.type} defaultValue={defaultValue} required={field.required} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none" />}</label>; }
function Stat({ label, value, note }: { label: string; value: string; note: string }) { return <article className="rounded-xl border border-[var(--border)] bg-white p-5"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-[11px] text-slate-500">{note}</p></article>; }

"use client";

import { useState } from "react";
import { ArrowLeft, Check, LayoutTemplate, LockKeyhole, Mail } from "lucide-react";
import { authenticateWithTemplate, getLoginTemplateAccess, type LoginTemplateAccess } from "@/app/actions/authentication";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function LoginForm({ hasError }: { hasError: boolean }) {
  const [email, setEmail] = useState(DEMO_MODE ? "demo" : "");
  const [password, setPassword] = useState(DEMO_MODE ? "demo" : "");
  const [access, setAccess] = useState<LoginTemplateAccess | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(hasError ? "Your sign-in or template selection could not be verified." : "");

  async function checkAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true); setError("");
    try {
      const result = await getLoginTemplateAccess({ email, password });
      if (!result.ok) { setError(result.error); return; }
      setAccess(result.access);
      setTemplateId(result.access.templates.some((template) => template.id === result.access.currentTemplateId) ? result.access.currentTemplateId : result.access.templates[0]?.id ?? "");
    } catch {
      setError("Connection lost while signing in. Check your internet and try again.");
    } finally {
      setChecking(false);
    }
  }

  if (access) {
    return <form action={authenticateWithTemplate} className="mt-8 space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value={password} />
      <input type="hidden" name="templateId" value={templateId} />
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p> : null}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-bold text-emerald-900">{access.businessName}</p>
        <p className="mt-1 text-[11px] text-emerald-700">{access.plan} · {access.templates.length} available template{access.templates.length === 1 ? "" : "s"}</p>
      </div>
      <fieldset>
        <legend className="mb-3 text-xs font-bold text-slate-700">Choose your workspace template</legend>
        <div className="space-y-2">
          {access.templates.map((template) => <label key={template.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${templateId === template.id ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <input type="radio" value={template.id} checked={templateId === template.id} onChange={() => setTemplateId(template.id)} className="sr-only" />
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${templateId === template.id ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}><LayoutTemplate size={17} /></span>
            <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-900">{template.name}</span>{templateId === template.id ? <Check size={15} className="text-emerald-700" /> : null}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{template.description}</span></span>
          </label>)}
        </div>
      </fieldset>
      <button disabled={!templateId} className="h-12 w-full rounded-lg bg-[var(--brand)] font-bold text-white shadow-sm transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50">Open selected workspace</button>
      <button type="button" onClick={() => { setAccess(null); setTemplateId(""); setError(""); }} className="flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Use another account</button>
    </form>;
  }

  return <form onSubmit={checkAccess} className="mt-8 space-y-5">
    {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p> : null}
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">{DEMO_MODE ? "Demo ID or email" : "Email"}</span>
      <span className="relative block"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input name="email" type="text" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></span>
    </label>
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">Password</span>
      <span className="relative block"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></span>
    </label>
    <button disabled={checking} className="h-12 w-full rounded-lg bg-[var(--brand)] font-bold text-white shadow-sm transition hover:bg-[var(--brand-dark)] disabled:opacity-60">{checking ? "Checking subscription…" : "Continue"}</button>
  </form>;
}

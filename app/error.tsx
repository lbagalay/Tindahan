"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-[var(--danger)]"><TriangleAlert size={22} /></span>
        <h2 className="mt-4 font-display text-base font-semibold text-[var(--foreground)]">Something went wrong</h2>
        <p className="mt-1.5 text-sm text-[var(--muted)]">This screen hit an unexpected error. Your data is safe — try again, and if it keeps happening, refresh the page.</p>
        <button onClick={() => retry()} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] text-sm font-bold text-white transition hover:bg-[var(--brand-dark)]"><RefreshCw size={16} /> Try again</button>
      </div>
    </div>
  );
}

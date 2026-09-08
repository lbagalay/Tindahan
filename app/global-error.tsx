"use client";

import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <div className="grid min-h-screen place-items-center bg-[var(--background)] px-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-white p-6 text-center shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Tindahan hit a snag</h2>
            <p className="mt-1.5 text-sm text-slate-500">The app failed to load. Please try again — your sales and inventory data are unaffected.</p>
            <button onClick={() => retry()} className="mt-5 h-11 w-full rounded-lg bg-[var(--brand)] text-sm font-bold text-white transition hover:bg-[var(--brand-dark)]">Try again</button>
          </div>
        </div>
      </body>
    </html>
  );
}

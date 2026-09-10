"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function ServiceWorkerRegistration() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    try { setDismissed(localStorage.getItem("tindahan:install-dismissed") === "1"); } catch { /* private mode */ }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!installEvent || dismissed) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem("tindahan:install-dismissed", "1"); } catch { /* private mode */ }
  }

  return (
    <div className="no-print fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl sm:left-auto sm:right-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Download size={18} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[var(--foreground)]">Install Tindahan</p>
        <p className="mt-0.5 text-[11px] leading-4 text-[var(--muted)]">Add it to your home screen for a full-screen counter that still works offline.</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <button onClick={install} className="h-8 rounded-lg bg-[var(--brand)] px-3 text-[11px] font-bold text-white hover:bg-[var(--brand-dark)]">Install</button>
        <button onClick={dismiss} className="grid h-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)]" aria-label="Dismiss"><X size={14} /></button>
      </div>
    </div>
  );
}

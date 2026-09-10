"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { getPendingSales } from "@/lib/offline-db";
import { QUEUE_CHANGED_EVENT } from "@/components/pos/offline-sync-manager";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    function refreshPending() { getPendingSales().then((sales) => setPending(sales.length)).catch(() => {}); }
    refreshPending();
    function goOnline() { setOnline(true); refreshPending(); }
    function goOffline() { setOnline(false); }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener(QUEUE_CHANGED_EVENT, refreshPending);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener(QUEUE_CHANGED_EVENT, refreshPending);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${online ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-700"}`}>
      {online ? <RefreshCw size={12} /> : <CloudOff size={12} />}
      {online ? `Syncing ${pending} offline sale${pending === 1 ? "" : "s"}…` : "Offline — sales are saved on this device"}
    </div>
  );
}

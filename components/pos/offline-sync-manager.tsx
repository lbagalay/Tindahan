"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { completeSale } from "@/app/actions/sales";
import { getPendingSales, removePendingSale } from "@/lib/offline-db";

export const QUEUE_CHANGED_EVENT = "tindahan:queue-changed";

export function notifyQueueChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

/**
 * Mounted once in the root layout. Whenever the browser comes back online,
 * flushes any sales that were rung up offline — in the order they were made,
 * stopping at the first failure so a later sale never lands before an earlier
 * one. Each sale carries its own clientTransactionId, so a sale that partially
 * succeeded before a dropped connection is never posted twice on retry.
 */
export function OfflineSyncManager() {
  const router = useRouter();
  const syncing = useRef(false);

  const flush = useCallback(async () => {
    if (syncing.current || typeof navigator === "undefined" || !navigator.onLine) return;
    syncing.current = true;
    try {
      const pending = await getPendingSales();
      let syncedAny = false;
      for (const sale of pending) {
        try {
          const result = await completeSale(sale.payload);
          if (!result.ok) break; // a real validation failure (e.g. item deleted) — leave it queued for a human to resolve, don't skip ahead
          await removePendingSale(sale.clientTransactionId);
          syncedAny = true;
          notifyQueueChanged();
        } catch {
          break; // still offline or a network hiccup — stop, preserve order, try again next time
        }
      }
      if (syncedAny) router.refresh();
    } finally {
      syncing.current = false;
    }
  }, [router]);

  useEffect(() => {
    flush();
    window.addEventListener("online", flush);
    const interval = window.setInterval(flush, 30_000);
    return () => { window.removeEventListener("online", flush); window.clearInterval(interval); };
  }, [flush]);

  return null;
}

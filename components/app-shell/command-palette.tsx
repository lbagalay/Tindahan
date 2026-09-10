"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, Settings, type LucideIcon } from "lucide-react";
import { navigation } from "./navigation";
import type { ModuleSettings, Terminology } from "@/lib/platform-config";

type Destination = { label: string; href: string; icon: LucideIcon };

/**
 * ⌘K quick switcher: jump to any enabled section, or hand a free-text query to
 * search. Mounted only while open (by the header), so its state resets each time.
 */
export function CommandPalette({ onClose, role, modules, terminology }: { onClose: () => void; role: "OWNER" | "STAFF"; modules: ModuleSettings; terminology: Terminology }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const destinations = useMemo<Destination[]>(() => {
    const items: Destination[] = navigation.filter((item) => modules[item.module]).map((item) => ({ label: item.label(terminology), href: item.href, icon: item.icon }));
    if (role === "OWNER") items.push({ label: "Settings", href: "/settings", icon: Settings });
    return items;
  }, [modules, terminology, role]);

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const filtered = useMemo(() => (needle ? destinations.filter((item) => item.label.toLowerCase().includes(needle)) : destinations), [destinations, needle]);
  const showSearch = trimmed.length > 0;
  const total = filtered.length + (showSearch ? 1 : 0);

  function go(index: number) {
    if (showSearch && index === filtered.length) { router.push(`/search?q=${encodeURIComponent(trimmed)}`); onClose(); return; }
    const dest = filtered[index];
    if (dest) { router.push(dest.href); onClose(); }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (total === 0 && event.key !== "Escape") return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((current) => (current + 1) % total); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((current) => (current - 1 + total) % total); }
    else if (event.key === "Enter") { event.preventDefault(); go(active); }
    else if (event.key === "Escape") { event.preventDefault(); onClose(); }
  }

  return (
    <div className="no-print fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/40 p-4 pt-[12vh] backdrop-blur-[2px]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search size={18} className="shrink-0 text-[var(--muted)]" />
          <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={onKeyDown} placeholder="Jump to a section, or type to search…" className="h-14 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" />
          <span className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">Esc</span>
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-2">
          {filtered.map((dest, index) => (
            <li key={dest.href}>
              <button type="button" onMouseMove={() => setActive(index)} onClick={() => go(index)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active === index ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--foreground)]"}`}>
                <dest.icon size={17} className="shrink-0" />
                <span className="flex-1">{dest.label}</span>
                {active === index ? <CornerDownLeft size={14} className="text-[var(--muted)]" /> : null}
              </button>
            </li>
          ))}
          {showSearch ? (
            <li>
              <button type="button" onMouseMove={() => setActive(filtered.length)} onClick={() => go(filtered.length)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active === filtered.length ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--foreground)]"}`}>
                <Search size={17} className="shrink-0" />
                <span className="flex-1">Search for “{trimmed}”</span>
              </button>
            </li>
          ) : null}
          {total === 0 ? <li className="px-3 py-6 text-center text-xs text-[var(--muted)]">No matches.</li> : null}
        </ul>
      </div>
    </div>
  );
}

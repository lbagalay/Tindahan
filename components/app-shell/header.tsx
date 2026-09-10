"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { initials } from "@/lib/utils";
import type { ModuleSettings, Terminology } from "@/lib/platform-config";

export function Header({ onMenu, userName = "Staff", role, lowStockCount, modules, terminology }: { onMenu: () => void; userName?: string; role: "OWNER" | "STAFF"; lowStockCount: number; modules: ModuleSettings; terminology: Terminology }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  return (
    <header className="no-print sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[var(--ink-soft)] lg:hidden" onClick={onMenu}>
          <Menu size={19} />
        </button>
        <form action="/search" method="get" className="relative hidden w-full max-w-[360px] sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} />
          <input
            ref={searchRef}
            name="q"
            aria-label="Search"
            placeholder={`Search ${terminology.products.toLowerCase()}, ${terminology.customers.toLowerCase()}, receipts…`}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] pl-10 pr-3 text-sm outline-none transition focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">⌘ K</span>
        </form>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {modules.inventory ? <Link href="/inventory" className="relative grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)]" aria-label={`${lowStockCount} low-stock notifications`} title={`${lowStockCount} low-stock item${lowStockCount === 1 ? "" : "s"}`}>
          <Bell size={19} />
          {lowStockCount ? <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-[var(--surface)]">{lowStockCount > 9 ? "9+" : lowStockCount}</span> : null}
        </Link> : null}
        <div className="h-7 w-px bg-[var(--border)]" />
        <div className="relative">
          <button onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen} className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-[var(--surface-subtle)]">
          <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)]">{initials(userName)}</span>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-[var(--foreground)]">{userName}</p>
            <p className="text-left text-[11px] capitalize text-[var(--muted)]">{role.toLowerCase()}</p>
          </div>
          </button>
          {profileOpen ? <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl"><div className="border-b border-[var(--border)] px-3 py-2 sm:hidden"><p className="text-xs font-bold text-[var(--foreground)]">{userName}</p><p className="mt-0.5 text-[10px] capitalize text-[var(--muted)]">{role.toLowerCase()}</p></div><button onClick={() => signOut({ callbackUrl: "/login" })} className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={15} /> Sign out</button></div> : null}
        </div>
      </div>
    </header>
  );
}

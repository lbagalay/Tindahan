"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Settings,
  ShoppingBasket,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleKey, ModuleSettings, Terminology } from "@/lib/platform-config";

const navigation = [
  { href: "/", module: "dashboard", label: () => "Dashboard", icon: LayoutDashboard },
  { href: "/pos", module: "pos", label: (terms: Terminology) => terms.pointOfSale, icon: ShoppingBasket },
  { href: "/products", module: "catalog", label: (terms: Terminology) => terms.catalog, icon: PackageSearch },
  { href: "/inventory", module: "inventory", label: (terms: Terminology) => terms.inventory, icon: Boxes },
  { href: "/customers", module: "customers", label: (terms: Terminology) => terms.customers, icon: Users },
  { href: "/transactions", module: "transactions", label: (terms: Terminology) => terms.transactions, icon: ReceiptText },
  { href: "/reports", module: "reports", label: () => "Reports", icon: BarChart3 },
  { href: "/appointments", module: "appointments", label: (terms: Terminology) => terms.appointments, icon: CalendarDays },
  { href: "/job-orders", module: "jobOrders", label: (terms: Terminology) => terms.jobOrders, icon: Wrench },
];

export function Sidebar({ open, onClose, role, businessName, currency, logo, workspaceName, workspaceTagline, modules, terminology }: { open: boolean; onClose: () => void; role: "OWNER" | "STAFF"; businessName: string; currency: string; logo: string; workspaceName: string; workspaceTagline: string; modules: ModuleSettings; terminology: Terminology }) {
  const pathname = usePathname();
  const visibleNavigation = navigation.filter((item) => modules[item.module as ModuleKey]);
  const isTindahanLogo = logo.endsWith("/tindahan-logo.png");

  return (
    <>
      {open ? <button aria-label="Close navigation" className="no-print fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={onClose} /> : null}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-black/20 bg-[var(--sidebar)] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-white text-[var(--brand)] shadow-sm">
              {logo ? <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={`${workspaceName} logo`} className={isTindahanLogo ? "size-full scale-[3] object-contain" : "size-full object-cover"} />
              </> : <CircleDollarSign size={21} strokeWidth={2.4} />}
            </span>
            <span>
              <span className="block max-w-[140px] truncate font-display text-base font-semibold leading-4 tracking-tight">{workspaceName}</span>
              <span className="mt-1 block max-w-[140px] truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">{workspaceTagline}</span>
            </span>
          </Link>
          <button className="grid size-8 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose}>
            <ChevronLeft size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Workspace</p>
          {visibleNavigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-white/75 transition-colors",
                  active ? "bg-white/12 text-white shadow-sm" : "hover:bg-white/[0.07] hover:text-white",
                )}
              >
                <item.icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                {item.label(terminology)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          {role === "OWNER" ? <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-white/75 hover:bg-white/[0.07] hover:text-white",
              pathname.startsWith("/settings") && "bg-white/12 text-white",
            )}
          >
            <Settings size={18} /> Settings
          </Link> : null}
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-3">
            <p className="truncate text-xs font-semibold text-white">{businessName}</p>
            <p className="mt-1 text-[11px] text-white/60">Main branch · {currency}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

import {
  BarChart3,
  Boxes,
  CalendarDays,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  ShoppingBasket,
  Users,
  Wheat,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey, Terminology } from "@/lib/platform-config";

export type NavItem = { href: string; module: ModuleKey; label: (terms: Terminology) => string; icon: LucideIcon };

/** Primary workspace navigation, shared by the sidebar and the command palette. */
export const navigation: NavItem[] = [
  { href: "/", module: "dashboard", label: () => "Dashboard", icon: LayoutDashboard },
  { href: "/pos", module: "pos", label: (terms) => terms.pointOfSale, icon: ShoppingBasket },
  { href: "/products", module: "catalog", label: (terms) => terms.catalog, icon: PackageSearch },
  { href: "/inventory", module: "inventory", label: (terms) => terms.inventory, icon: Boxes },
  { href: "/ingredients", module: "ingredients", label: () => "Ingredients", icon: Wheat },
  { href: "/customers", module: "customers", label: (terms) => terms.customers, icon: Users },
  { href: "/transactions", module: "transactions", label: (terms) => terms.transactions, icon: ReceiptText },
  { href: "/reports", module: "reports", label: () => "Reports", icon: BarChart3 },
  { href: "/appointments", module: "appointments", label: (terms) => terms.appointments, icon: CalendarDays },
  { href: "/job-orders", module: "jobOrders", label: (terms) => terms.jobOrders, icon: Wrench },
];

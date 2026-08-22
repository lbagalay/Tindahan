"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { ModuleSettings, Terminology } from "@/lib/platform-config";

type ShellCustomization = { logo: string; workspaceName: string; workspaceTagline: string; brandColor: string; brandDarkColor: string; brandSoftColor: string; sidebarColor: string; modules: ModuleSettings; terminology: Terminology };

export function AppShell({ children, userName, role, businessName, currency, lowStockCount, customization }: { children: React.ReactNode; userName?: string; role: "OWNER" | "STAFF"; businessName: string; currency: string; lowStockCount: number; customization: ShellCustomization }) {
  const [open, setOpen] = useState(false);
  const theme = { "--brand": customization.brandColor, "--brand-dark": customization.brandDarkColor, "--brand-soft": customization.brandSoftColor, "--sidebar": customization.sidebarColor } as CSSProperties;

  return (
    <div className="min-h-screen" style={theme}>
      <Sidebar open={open} onClose={() => setOpen(false)} role={role} businessName={businessName} currency={currency} logo={customization.logo} workspaceName={customization.workspaceName} workspaceTagline={customization.workspaceTagline} modules={customization.modules} terminology={customization.terminology} />
      <div className="app-shell-content lg:pl-[252px]">
        <Header onMenu={() => setOpen(true)} userName={userName} role={role} lowStockCount={lowStockCount} modules={customization.modules} terminology={customization.terminology} />
        <main className="app-main p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

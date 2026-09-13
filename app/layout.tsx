import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { FilteredAnalytics } from "@/components/analytics/filtered-analytics";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import { OfflineSyncManager } from "@/components/pos/offline-sync-manager";
import { auth } from "@/auth";
import { getBusinessChrome } from "@/lib/queries";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "Tindahan POS", template: "%s · Tindahan POS" },
  description: "A reusable point-of-sale and business management system.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tindahan" },
};

const DEFAULT_THEME_COLOR = "#176b4d";

// The PWA's OS-level status/title bar color, so an installed app matches
// each business's own sidebar color instead of always showing the default
// brand green. Falls back to the default when logged out (e.g. /login).
export async function generateViewport(): Promise<Viewport> {
  let themeColor = DEFAULT_THEME_COLOR;
  try {
    const session = await auth();
    if (session?.user) {
      const business = await getBusinessChrome(session.user.businessId);
      themeColor = business?.settings?.sidebarColor ?? DEFAULT_THEME_COLOR;
    }
  } catch {
    // fall back to the default rather than fail the whole page over a theme color
  }
  return { themeColor, width: "device-width", initialScale: 1 };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        {children}
        <FilteredAnalytics />
        <ServiceWorkerRegistration />
        <OfflineSyncManager />
      </body>
    </html>
  );
}

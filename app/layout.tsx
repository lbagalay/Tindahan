import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import { OfflineSyncManager } from "@/components/pos/offline-sync-manager";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "Tindahan POS", template: "%s · Tindahan POS" },
  description: "A reusable point-of-sale and business management system.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tindahan" },
};

export const viewport: Viewport = {
  themeColor: "#176b4d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        {children}
        <Analytics />
        <ServiceWorkerRegistration />
        <OfflineSyncManager />
      </body>
    </html>
  );
}

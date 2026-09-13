import type { MetadataRoute } from "next";
import { auth } from "@/auth";
import { getBusinessChrome } from "@/lib/queries";

const DEFAULT_THEME_COLOR = "#176b4d";

// Installed/standalone PWA chrome (status bar, task switcher, splash screen)
// is drawn from this manifest's theme_color on most platforms — the dynamic
// per-page <meta name="theme-color"> tag alone doesn't reach it. Reading the
// session here (a request-time API) makes this route dynamic per business
// instead of a single cached file, so each business's installed app matches
// its own sidebar color.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let themeColor = DEFAULT_THEME_COLOR;
  try {
    const session = await auth();
    if (session?.user) {
      const business = await getBusinessChrome(session.user.businessId);
      themeColor = business?.settings?.sidebarColor ?? DEFAULT_THEME_COLOR;
    }
  } catch {
    // fall back to the default rather than fail manifest resolution over a theme color
  }
  return {
    name: "Tindahan Business OS",
    short_name: "Tindahan",
    description: "Point of sale, inventory, and business management — works at the counter even when the connection doesn't.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6efe0",
    theme_color: themeColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

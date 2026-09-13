import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { resolvePlatformConfig } from "@/lib/platform-config";
import { getBusinessChrome, getLowStockCount } from "@/lib/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const business = await getBusinessChrome(session.user.businessId);
  if (!business) redirect("/login");
  const settings = business.settings;
  const platform = resolvePlatformConfig(settings);
  const lowStockCount = await getLowStockCount(session.user.businessId, platform.templateId);
  return <AppShell userName={session.user.name ?? "Staff"} role={session.user.role} businessName={business.name} currency={settings?.currency ?? "PHP"} lowStockCount={lowStockCount} customization={{ logo: settings?.logo ?? "", workspaceName: settings?.workspaceName ?? "Tindahan", workspaceTagline: settings?.workspaceTagline ?? "Business OS", brandColor: settings?.brandColor ?? "#176b4d", brandDarkColor: settings?.brandDarkColor ?? "#0e5038", brandSoftColor: settings?.brandSoftColor ?? "#e4f2eb", sidebarColor: settings?.sidebarColor ?? "#123d2e", backgroundColor: settings?.backgroundColor ?? "#f6efe0", surfaceColor: settings?.surfaceColor ?? "#fffbf2", modules: platform.modules, terminology: platform.terminology }}>{children}</AppShell>;
}

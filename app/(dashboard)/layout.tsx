import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const business = await prisma.business.findUnique({ where: { id: session.user.businessId }, include: { settings: { select: { currency: true, logo: true, workspaceName: true, workspaceTagline: true, brandColor: true, brandDarkColor: true, brandSoftColor: true, sidebarColor: true, templateId: true, enabledModules: true, featureFlags: true, terminology: true } } } });
  if (!business) redirect("/login");
  const settings = business.settings;
  const platform = resolvePlatformConfig(settings);
  const lowStockCount = await prisma.product.count({ where: { businessId: session.user.businessId, type: "PRODUCT", status: "ACTIVE", stock: { lte: prisma.product.fields.lowStockThreshold }, ...templateCatalogScope(platform.templateId) } });
  return <AppShell userName={session.user.name ?? "Staff"} role={session.user.role} businessName={business.name} currency={settings?.currency ?? "PHP"} lowStockCount={lowStockCount} customization={{ logo: settings?.logo ?? "", workspaceName: settings?.workspaceName ?? "Tindahan", workspaceTagline: settings?.workspaceTagline ?? "Business OS", brandColor: settings?.brandColor ?? "#176b4d", brandDarkColor: settings?.brandDarkColor ?? "#0e5038", brandSoftColor: settings?.brandSoftColor ?? "#e4f2eb", sidebarColor: settings?.sidebarColor ?? "#123d2e", modules: platform.modules, terminology: platform.terminology }}>{children}</AppShell>;
}

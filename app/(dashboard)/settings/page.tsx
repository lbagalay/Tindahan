import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm, type SettingsValues } from "@/components/settings/settings-form";
import { CustomizationForm, type CustomizationValues } from "@/components/settings/customization-form";
import { TemplateManager } from "@/components/settings/template-manager";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { readCustomFields, readDashboardWidgets } from "@/lib/customization";
import { resolvePlatformConfig, resolveTemplateSubscription } from "@/lib/platform-config";

export default async function SettingsPage() {
  const session = await auth(); if (!session?.user) redirect("/login"); if (session.user.role !== "OWNER") redirect("/");
  const business = await prisma.business.findUniqueOrThrow({ where: { id: session.user.businessId }, include: { settings: true } });
  const initialValues: SettingsValues = { businessName: business.name, businessType: business.settings?.businessType ?? "Small business", phone: business.settings?.phone ?? "", email: business.settings?.email ?? "", logo: business.settings?.logo ?? "", currency: business.settings?.currency ?? "PHP", receiptPrefix: business.name.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "POS", address: business.settings?.address ?? "", taxPercentage: Number(business.settings?.taxPercentage ?? 0), receiptFooter: business.settings?.receiptFooter ?? "Thank you for your purchase." };
  const platform = resolvePlatformConfig(business.settings);
  const subscription = resolveTemplateSubscription(business.settings);
  const customization: CustomizationValues = { workspaceName: business.settings?.workspaceName ?? "Tindahan", workspaceTagline: business.settings?.workspaceTagline ?? "Business OS", brandColor: business.settings?.brandColor ?? "#176b4d", brandDarkColor: business.settings?.brandDarkColor ?? "#0e5038", brandSoftColor: business.settings?.brandSoftColor ?? "#e4f2eb", sidebarColor: business.settings?.sidebarColor ?? "#123d2e", receiptLayout: business.settings?.receiptLayout === "COMPACT" ? "COMPACT" : "DETAILED", dashboardWidgets: readDashboardWidgets(business.settings?.dashboardWidgets), customerCustomFields: readCustomFields(business.settings?.customerCustomFields), productCustomFields: readCustomFields(business.settings?.productCustomFields) };
  return <div className="mx-auto max-w-6xl"><PageHeader eyebrow="Configuration" title="Settings" description="Configure business details, templates, modules, terminology, receipts, and branding from one place." /><div className="mt-6"><SettingsForm initialValues={initialValues} /><TemplateManager initialValues={platform} allowedTemplates={subscription.templateIds} subscriptionPlan={subscription.plan} subscriptionStatus={subscription.status} /><CustomizationForm initialValues={customization} /></div></div>;
}

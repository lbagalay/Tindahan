import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";
import { PageHeader } from "@/components/ui/page-header";
import { AppointmentManager, type AppointmentRow } from "@/components/appointments/appointment-manager";

export default async function AppointmentsPage() {
  const session = await auth(); if (!session?.user) redirect("/login"); const businessId = session.user.businessId;
  const settings = await prisma.businessSettings.findUnique({ where: { businessId }, select: { templateId: true, enabledModules: true, featureFlags: true, terminology: true } });
  const platform = resolvePlatformConfig(settings);
  if (!platform.modules.appointments) redirect(session.user.role === "OWNER" ? "/settings" : "/");
  const [records, customers, services, memberships] = await Promise.all([
    prisma.appointment.findMany({ where: { businessId }, include: { customer: true, service: true, staff: true }, orderBy: { startsAt: "asc" }, take: 200 }),
    prisma.customer.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { businessId, type: "SERVICE", status: "ACTIVE", ...templateCatalogScope(platform.templateId) }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.membership.findMany({ where: { businessId }, include: { user: { select: { id: true, name: true } } } }),
  ]);
  const appointments: AppointmentRow[] = records.map((item) => ({ id: item.id, title: item.title, customer: item.customer?.name ?? "Walk-in customer", service: item.service?.name ?? "No linked service", staff: item.staff?.name ?? "Unassigned", startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(), date: item.startsAt.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }), time: `${item.startsAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })}–${item.endsAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })}`, status: item.status, notes: item.notes ?? "" }));
  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Scheduling" title={platform.terminology.appointments} description={`Plan ${platform.terminology.customer.toLowerCase()} visits, ${platform.terminology.services.toLowerCase()}, and ${platform.terminology.staff.toLowerCase()} schedules.`} /><div className="mt-6"><AppointmentManager appointments={appointments} customers={customers} services={services} staff={memberships.map((item) => item.user)} examples={platform.examples} /></div></div>;
}

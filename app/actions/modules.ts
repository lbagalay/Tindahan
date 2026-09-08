"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolvePlatformConfig, templateCatalogScope } from "@/lib/platform-config";
import { businessHasModule } from "@/lib/platform-config.server";
import { revalidateBusiness } from "@/lib/queries";

const optionalId = z.union([z.string().min(1), z.literal("")]).optional();
const appointmentSchema = z.object({ title: z.string().trim().min(2).max(120), customerId: optionalId, serviceId: optionalId, staffId: optionalId, startsAt: z.string().min(1), endsAt: z.string().min(1), notes: z.string().trim().max(500).optional() });

export async function createAppointment(input: z.infer<typeof appointmentSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  const parsed = appointmentSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the appointment details." };
  const startsAt = new Date(parsed.data.startsAt); const endsAt = new Date(parsed.data.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return { ok: false as const, error: "The end time must be after the start time." };
  const businessId = session.user.businessId;
  try {
    const settings = await prisma.businessSettings.findUnique({ where: { businessId }, select: { templateId: true, enabledModules: true, featureFlags: true, terminology: true } });
    const platform = resolvePlatformConfig(settings);
    if (!platform.modules.appointments) return { ok: false as const, error: "Appointments are not enabled." };
    if (parsed.data.customerId && !await prisma.customer.count({ where: { id: parsed.data.customerId, businessId } })) return { ok: false as const, error: "Customer not found." };
    if (parsed.data.serviceId && !await prisma.product.count({ where: { id: parsed.data.serviceId, businessId, type: "SERVICE", status: "ACTIVE", ...templateCatalogScope(platform.templateId) } })) return { ok: false as const, error: "Service not found." };
    if (parsed.data.staffId && !await prisma.membership.count({ where: { userId: parsed.data.staffId, businessId } })) return { ok: false as const, error: "Staff member not found." };
    const record = await prisma.appointment.create({ data: { businessId, title: parsed.data.title, customerId: parsed.data.customerId || null, serviceId: parsed.data.serviceId || null, staffId: parsed.data.staffId || null, startsAt, endsAt, notes: parsed.data.notes || null } });
    revalidateBusiness(businessId); revalidatePath("/appointments"); return { ok: true as const, id: record.id };
  } catch { return { ok: false as const, error: "The appointment could not be created." }; }
}

const appointmentStatusSchema = z.object({ id: z.string().min(1), status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) });
export async function updateAppointmentStatus(input: z.infer<typeof appointmentStatusSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "appointments")) return { ok: false as const, error: "Appointments are not enabled." };
  const parsed = appointmentStatusSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Invalid appointment status." };
  const result = await prisma.appointment.updateMany({ where: { id: parsed.data.id, businessId: session.user.businessId }, data: { status: parsed.data.status } });
  if (!result.count) return { ok: false as const, error: "Appointment not found." };
  revalidateBusiness(session.user.businessId); revalidatePath("/appointments"); return { ok: true as const };
}

const jobOrderSchema = z.object({ title: z.string().trim().min(2).max(120), customerId: optionalId, productId: optionalId, assignedToId: optionalId, description: z.string().trim().max(1000).optional(), estimatedAmount: z.number().nonnegative().optional(), dueAt: z.string().optional(), notes: z.string().trim().max(500).optional() });
export async function createJobOrder(input: z.infer<typeof jobOrderSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  const parsed = jobOrderSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the job-order details." };
  const businessId = session.user.businessId;
  try {
    const settings = await prisma.businessSettings.findUnique({ where: { businessId }, select: { templateId: true, enabledModules: true, featureFlags: true, terminology: true } });
    const platform = resolvePlatformConfig(settings);
    if (!platform.modules.jobOrders) return { ok: false as const, error: "Job orders are not enabled." };
    if (parsed.data.customerId && !await prisma.customer.count({ where: { id: parsed.data.customerId, businessId } })) return { ok: false as const, error: "Customer not found." };
    if (parsed.data.productId && !await prisma.product.count({ where: { id: parsed.data.productId, businessId, status: "ACTIVE", ...templateCatalogScope(platform.templateId) } })) return { ok: false as const, error: "Product or service not found." };
    if (parsed.data.assignedToId && !await prisma.membership.count({ where: { userId: parsed.data.assignedToId, businessId } })) return { ok: false as const, error: "Staff member not found." };
    const now = new Date(); const dateKey = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`; const count = await prisma.jobOrder.count({ where: { businessId } });
    const record = await prisma.jobOrder.create({ data: { businessId, referenceNumber: `JO-${dateKey}-${String(count + 1).padStart(4, "0")}`, title: parsed.data.title, customerId: parsed.data.customerId || null, productId: parsed.data.productId || null, assignedToId: parsed.data.assignedToId || null, description: parsed.data.description || null, estimatedAmount: parsed.data.estimatedAmount ?? null, dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null, notes: parsed.data.notes || null } });
    revalidateBusiness(businessId); revalidatePath("/job-orders"); return { ok: true as const, id: record.id, referenceNumber: record.referenceNumber };
  } catch { return { ok: false as const, error: "The job order could not be created." }; }
}

const jobStatusSchema = z.object({ id: z.string().min(1), status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_PARTS", "READY", "COMPLETED", "CANCELLED"]) });
export async function updateJobOrderStatus(input: z.infer<typeof jobStatusSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "jobOrders")) return { ok: false as const, error: "Job orders are not enabled." };
  const parsed = jobStatusSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Invalid job-order status." };
  const result = await prisma.jobOrder.updateMany({ where: { id: parsed.data.id, businessId: session.user.businessId }, data: { status: parsed.data.status } });
  if (!result.count) return { ok: false as const, error: "Job order not found." };
  revalidateBusiness(session.user.businessId); revalidatePath("/job-orders"); return { ok: true as const };
}

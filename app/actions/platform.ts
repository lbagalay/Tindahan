"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applyBusinessTemplateForBusiness } from "@/lib/apply-business-template.server";
import {
  businessTemplateIds,
  featureFlagKeys,
  moduleKeys,
  resolveTemplateSubscription,
  terminologyKeys,
} from "@/lib/platform-config";

const templateSchema = z.enum(businessTemplateIds);
const moduleSchema = z.object(Object.fromEntries(moduleKeys.map((key) => [key, z.boolean()])) as Record<(typeof moduleKeys)[number], z.ZodBoolean>);
const featureSchema = z.object(Object.fromEntries(featureFlagKeys.map((key) => [key, z.boolean()])) as Record<(typeof featureFlagKeys)[number], z.ZodBoolean>);
const terminologySchema = z.object(Object.fromEntries(terminologyKeys.map((key) => [key, z.string().trim().min(1).max(40)])) as Record<(typeof terminologyKeys)[number], z.ZodString>);
const configurationSchema = z.object({ modules: moduleSchema, features: featureSchema, terminology: terminologySchema });

export async function applyBusinessTemplate(input: { templateId: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return { ok: false as const, error: "Only an owner can apply a business template." };
  const parsed = templateSchema.safeParse(input.templateId);
  if (!parsed.success) return { ok: false as const, error: "Choose a valid business template." };

  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { businessId: session.user.businessId },
      select: { templateId: true, subscriptionPlan: true, subscriptionStatus: true, entitledTemplates: true },
    });
    const subscription = resolveTemplateSubscription(settings);
    if (subscription.status !== "ACTIVE") return { ok: false as const, error: "Your subscription is not active." };
    if (!subscription.templateIds.includes(parsed.data)) return { ok: false as const, error: "This template is not included in your subscription." };
    await applyBusinessTemplateForBusiness({ businessId: session.user.businessId, userId: session.user.id, templateId: parsed.data });
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/pos");
    revalidatePath("/inventory");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "The template could not be applied." };
  }
}

export async function updatePlatformConfiguration(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return { ok: false as const, error: "Only an owner can change platform configuration." };
  const parsed = configurationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the module, feature, and terminology values." };

  const modules = { ...parsed.data.modules, dashboard: true };
  const features = {
    ...parsed.data.features,
    appointments: modules.appointments && parsed.data.features.appointments,
    jobOrders: modules.jobOrders && parsed.data.features.jobOrders,
    inventoryTracking: modules.inventory && parsed.data.features.inventoryTracking,
  };
  try {
    await prisma.businessSettings.update({
      where: { businessId: session.user.businessId },
      data: {
        enabledModules: modules as Prisma.InputJsonValue,
        featureFlags: features as Prisma.InputJsonValue,
        terminology: parsed.data.terminology as Prisma.InputJsonValue,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "The platform configuration could not be saved." };
  }
}

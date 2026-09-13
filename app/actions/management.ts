"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dashboardWidgetKeys } from "@/lib/customization";
import { businessHasModule, getBusinessPlatformConfig } from "@/lib/platform-config.server";
import { templateCatalogScope, userCatalogSource } from "@/lib/platform-config";
import { revalidateBusiness } from "@/lib/queries";

const catalogSchema = z.object({
  name: z.string().trim().min(2).max(120), sku: z.string().trim().min(2).max(50), category: z.string().trim().min(2).max(60),
  type: z.enum(["PRODUCT", "SERVICE"]), image: z.union([z.string().url(), z.literal("")]).optional(), customValues: z.record(z.string(), z.string().max(500)).optional(), cost: z.number().nonnegative(), price: z.number().positive(), stock: z.number().int().nonnegative(), threshold: z.number().int().nonnegative(),
});

const catalogUpdateSchema = catalogSchema.omit({ stock: true }).extend({ id: z.string().min(1), status: z.enum(["ACTIVE", "INACTIVE"]) });

export async function createCatalogItem(input: z.infer<typeof catalogSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "catalog")) return { ok: false as const, error: "The catalog module is not enabled." };
  const parsed = catalogSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the item details and try again." };
  try {
    const platform = await getBusinessPlatformConfig(session.user.businessId);
    const item = await prisma.$transaction(async (tx) => {
      const category = await tx.category.upsert({ where: { businessId_name: { businessId: session.user.businessId, name: parsed.data.category } }, update: {}, create: { businessId: session.user.businessId, name: parsed.data.category } });
      const product = await tx.product.create({ data: { businessId: session.user.businessId, categoryId: category.id, name: parsed.data.name, sku: parsed.data.sku.toUpperCase(), type: parsed.data.type, image: parsed.data.image || null, customValues: parsed.data.customValues ?? {}, cost: parsed.data.cost, price: parsed.data.price, stock: parsed.data.type === "PRODUCT" ? parsed.data.stock : 0, lowStockThreshold: parsed.data.type === "PRODUCT" ? parsed.data.threshold : 0, templateSource: userCatalogSource(platform.templateId) } });
      if (product.type === "PRODUCT" && product.stock > 0) await tx.inventoryMovement.create({ data: { businessId: session.user.businessId, productId: product.id, createdById: session.user.id, type: "OPENING_STOCK", quantity: product.stock, stockBefore: 0, stockAfter: product.stock, reason: "Opening stock on item creation" } });
      return product;
    });
    revalidateBusiness(session.user.businessId); revalidatePath("/products"); revalidatePath("/inventory"); revalidatePath("/pos"); return { ok: true as const, id: item.id };
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false as const, error: "That SKU is already in use." }; return { ok: false as const, error: "The item could not be created." }; }
}

export async function updateCatalogItem(input: z.infer<typeof catalogUpdateSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "catalog")) return { ok: false as const, error: "The catalog module is not enabled." };
  const parsed = catalogUpdateSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the item details and try again." };
  try {
    const platform = await getBusinessPlatformConfig(session.user.businessId);
    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({ where: { id: parsed.data.id, businessId: session.user.businessId, ...templateCatalogScope(platform.templateId) } });
      if (!existing) throw new Error("Item not found.");
      const category = await tx.category.upsert({ where: { businessId_name: { businessId: session.user.businessId, name: parsed.data.category } }, update: {}, create: { businessId: session.user.businessId, name: parsed.data.category } });
      return tx.product.update({ where: { id: existing.id }, data: { categoryId: category.id, name: parsed.data.name, sku: parsed.data.sku.toUpperCase(), image: parsed.data.image || null, customValues: parsed.data.customValues ?? existing.customValues as Prisma.InputJsonValue, cost: parsed.data.cost, price: parsed.data.price, lowStockThreshold: existing.type === "PRODUCT" ? parsed.data.threshold : 0, status: parsed.data.status } });
    });
    revalidateBusiness(session.user.businessId); revalidatePath("/", "layout"); revalidatePath("/products"); revalidatePath("/inventory"); revalidatePath("/pos"); revalidatePath("/reports");
    return { ok: true as const, item: { id: item.id, stock: item.stock } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false as const, error: "That SKU is already in use." };
    return { ok: false as const, error: error instanceof Error ? error.message : "The item could not be updated." };
  }
}

const customerSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).optional(), email: z.union([z.string().email(), z.literal("")]).optional(), notes: z.string().trim().max(500).optional(), customValues: z.record(z.string(), z.string().max(500)).optional() });
export async function createCustomer(input: z.infer<typeof customerSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "customers")) return { ok: false as const, error: "The customer module is not enabled." };
  const parsed = customerSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the customer details and try again." };
  try { const customer = await prisma.customer.create({ data: { businessId: session.user.businessId, name: parsed.data.name, phone: parsed.data.phone || null, email: parsed.data.email || null, notes: parsed.data.notes || null, customValues: parsed.data.customValues ?? {} } }); revalidateBusiness(session.user.businessId); revalidatePath("/customers"); return { ok: true as const, id: customer.id }; }
  catch { return { ok: false as const, error: "The customer could not be created." }; }
}

const customerUpdateSchema = customerSchema.extend({ id: z.string().min(1) });
export async function updateCustomer(input: z.infer<typeof customerUpdateSchema>) {
  const session = await auth(); if (!session?.user) return { ok: false as const, error: "Not authorized." };
  if (!await businessHasModule(session.user.businessId, "customers")) return { ok: false as const, error: "The customer module is not enabled." };
  const parsed = customerUpdateSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the customer details and try again." };
  try {
    const result = await prisma.customer.updateMany({ where: { id: parsed.data.id, businessId: session.user.businessId }, data: { name: parsed.data.name, phone: parsed.data.phone || null, email: parsed.data.email || null, notes: parsed.data.notes || null, customValues: parsed.data.customValues ?? {} } });
    if (!result.count) return { ok: false as const, error: "Customer not found." };
    revalidateBusiness(session.user.businessId); revalidatePath("/customers"); revalidatePath("/pos"); revalidatePath("/transactions");
    return { ok: true as const };
  } catch { return { ok: false as const, error: "The customer could not be updated." }; }
}

const settingsSchema = z.object({ businessName: z.string().trim().min(2).max(120), businessType: z.string().trim().min(2).max(80), phone: z.string().trim().min(5).max(30), email: z.union([z.string().email(), z.literal("")]), logo: z.union([z.string().url(), z.string().regex(/^\/[a-z0-9/_\-.]+$/i), z.string().regex(/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/), z.literal("")]), currency: z.enum(["PHP", "USD", "EUR", "SGD", "AUD", "JPY"]), address: z.string().trim().min(5).max(250), taxPercentage: z.number().min(0).max(100), receiptFooter: z.string().trim().max(300) });
export async function updateBusinessSettings(input: z.infer<typeof settingsSchema>) {
  const session = await auth(); if (!session?.user || session.user.role !== "OWNER") return { ok: false as const, error: "Only an owner can change business settings." };
  const parsed = settingsSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: "Check the business details and try again." };
  try { await prisma.$transaction([prisma.business.update({ where: { id: session.user.businessId }, data: { name: parsed.data.businessName } }), prisma.businessSettings.update({ where: { businessId: session.user.businessId }, data: { businessType: parsed.data.businessType, phone: parsed.data.phone, email: parsed.data.email || null, logo: parsed.data.logo || null, currency: parsed.data.currency, address: parsed.data.address, taxPercentage: parsed.data.taxPercentage, receiptFooter: parsed.data.receiptFooter } })]); revalidateBusiness(session.user.businessId); revalidatePath("/", "layout"); revalidatePath("/settings"); revalidatePath("/pos"); revalidatePath("/transactions"); revalidatePath("/reports"); return { ok: true as const }; }
  catch { return { ok: false as const, error: "Settings could not be saved." }; }
}

const customFieldSchema = z.object({ id: z.string().trim().min(1).max(50), label: z.string().trim().min(1).max(60), type: z.enum(["text", "number", "date", "select"]), required: z.boolean(), options: z.array(z.string().trim().min(1).max(50)).max(20) });
const customizationSchema = z.object({
  workspaceName: z.string().trim().min(2).max(40),
  workspaceTagline: z.string().trim().min(2).max(60),
  brandColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  brandDarkColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  brandSoftColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  sidebarColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  surfaceColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  receiptLayout: z.enum(["COMPACT", "DETAILED"]),
  dashboardWidgets: z.array(z.enum(dashboardWidgetKeys)).max(dashboardWidgetKeys.length),
  customerCustomFields: z.array(customFieldSchema).max(12),
  productCustomFields: z.array(customFieldSchema).max(12),
});

export async function updateCustomizationSettings(input: z.infer<typeof customizationSchema>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return { ok: false as const, error: "Only an owner can change workspace customization." };
  const parsed = customizationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the customization values and try again." };
  try {
    await prisma.businessSettings.update({ where: { businessId: session.user.businessId }, data: parsed.data });
    revalidateBusiness(session.user.businessId);
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch { return { ok: false as const, error: "Customization settings could not be saved." }; }
}

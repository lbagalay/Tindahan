import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient, type ItemType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { businessTemplates } from "../lib/platform-config";

/**
 * One-time production setup for a single real cafe workspace.
 *
 * Creates the business, an owner (and optional cashier) with the passwords YOU
 * provide via env vars, the CAFE template, and a starter menu. The account is
 * entitled to ONLY the CAFE template, so the login flow can never reshape or
 * wipe the cafe's data by re-applying a different template.
 *
 * Run against the production database with your own values, e.g.:
 *   CAFE_NAME="Kape Habibi" \
 *   OWNER_NAME="Juan Dela Cruz" OWNER_EMAIL="owner@kapehabibi.ph" OWNER_PASSWORD="<strong-pass>" \
 *   CASHIER_NAME="Cashier" CASHIER_EMAIL="cashier@kapehabibi.ph" CASHIER_PASSWORD="<strong-pass>" \
 *   CAFE_CURRENCY="PHP" CAFE_TAX="0" CAFE_ADDRESS="..." CAFE_PHONE="..." \
 *   npm run db:setup-cafe
 */

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

function req(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "cafe";
}

async function main() {
  const cafeName = req("CAFE_NAME");
  const ownerName = req("OWNER_NAME");
  const ownerEmail = req("OWNER_EMAIL").toLowerCase();
  const ownerPassword = req("OWNER_PASSWORD");
  if (ownerPassword.length < 8) throw new Error("OWNER_PASSWORD must be at least 8 characters.");

  const slug = (process.env.CAFE_SLUG?.trim() && slugify(process.env.CAFE_SLUG!)) || slugify(cafeName);
  const currency = process.env.CAFE_CURRENCY?.trim() || "PHP";
  const taxPercentage = Number(process.env.CAFE_TAX ?? "0");
  const address = process.env.CAFE_ADDRESS?.trim() || "—";
  const phone = process.env.CAFE_PHONE?.trim() || "—";
  const receiptFooter = process.env.CAFE_RECEIPT_FOOTER?.trim() || "Salamat! Please come again.";
  const template = businessTemplates.CAFE;

  const business = await prisma.business.upsert({
    where: { slug },
    update: { name: cafeName },
    create: { name: cafeName, slug },
  });

  const ownerHash = await hash(ownerPassword, 12);
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { name: ownerName, passwordHash: ownerHash },
    create: { name: ownerName, email: ownerEmail, passwordHash: ownerHash },
  });
  await prisma.membership.upsert({
    where: { userId_businessId: { userId: owner.id, businessId: business.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, businessId: business.id, role: "OWNER" },
  });

  let cashierEmail: string | null = null;
  if (process.env.CASHIER_EMAIL?.trim() && process.env.CASHIER_PASSWORD?.trim()) {
    cashierEmail = process.env.CASHIER_EMAIL.trim().toLowerCase();
    const cashierPassword = process.env.CASHIER_PASSWORD.trim();
    if (cashierPassword.length < 8) throw new Error("CASHIER_PASSWORD must be at least 8 characters.");
    const cashierHash = await hash(cashierPassword, 12);
    const cashier = await prisma.user.upsert({
      where: { email: cashierEmail },
      update: { name: process.env.CASHIER_NAME?.trim() || "Cashier", passwordHash: cashierHash },
      create: { name: process.env.CASHIER_NAME?.trim() || "Cashier", email: cashierEmail, passwordHash: cashierHash },
    });
    await prisma.membership.upsert({
      where: { userId_businessId: { userId: cashier.id, businessId: business.id } },
      update: { role: "STAFF" },
      create: { userId: cashier.id, businessId: business.id, role: "STAFF" },
    });
  }

  await prisma.businessSettings.upsert({
    where: { businessId: business.id },
    update: {
      subscriptionPlan: "Trial",
      subscriptionStatus: "ACTIVE",
      entitledTemplates: ["CAFE"],
      templateId: "CAFE",
    },
    create: {
      businessId: business.id,
      address,
      phone,
      currency,
      taxPercentage,
      receiptFooter,
      businessType: template.businessType,
      workspaceName: cafeName,
      templateId: "CAFE",
      subscriptionPlan: "Trial",
      subscriptionStatus: "ACTIVE",
      entitledTemplates: ["CAFE"],
      enabledModules: template.modules,
      featureFlags: template.features,
      terminology: template.terminology,
      dashboardWidgets: template.dashboardWidgets,
    },
  });

  // Starter menu (categories + sample items). Idempotent by SKU.
  for (const [sortOrder, name] of template.suggestedCategories.entries()) {
    await prisma.category.upsert({
      where: { businessId_name: { businessId: business.id, name } },
      update: {},
      create: { businessId: business.id, name, sortOrder },
    });
  }
  for (const sample of template.sampleCatalog) {
    const category = await prisma.category.upsert({
      where: { businessId_name: { businessId: business.id, name: sample.category } },
      update: {},
      create: { businessId: business.id, name: sample.category, sortOrder: 0 },
    });
    const existing = await prisma.product.findUnique({ where: { businessId_sku: { businessId: business.id, sku: sample.sku } }, select: { id: true } });
    if (existing) continue;
    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: category.id,
        name: sample.name,
        sku: sample.sku,
        type: sample.type as ItemType,
        cost: sample.cost,
        price: sample.price,
        stock: sample.type === "PRODUCT" ? sample.stock : 0,
        lowStockThreshold: sample.type === "PRODUCT" ? sample.lowStockThreshold : 0,
        templateSource: "CAFE",
      },
    });
    if (product.type === "PRODUCT" && product.stock > 0) {
      await prisma.inventoryMovement.create({
        data: { businessId: business.id, productId: product.id, createdById: owner.id, type: "OPENING_STOCK", quantity: product.stock, stockBefore: 0, stockAfter: product.stock, reason: "Opening stock (setup)" },
      });
    }
  }

  console.log("✔ Cafe workspace ready");
  console.log(`  Business : ${cafeName} (slug: ${slug})`);
  console.log(`  Owner    : ${ownerEmail}`);
  console.log(`  Cashier  : ${cashierEmail ?? "(none — set CASHIER_EMAIL/CASHIER_PASSWORD to add one)"}`);
  console.log(`  Template : CAFE (entitled to CAFE only — login cannot reshape data)`);
  console.log(`  Currency : ${currency} · Tax ${taxPercentage}%`);
}

main()
  .catch((error) => { console.error("✖ Setup failed:", error instanceof Error ? error.message : error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

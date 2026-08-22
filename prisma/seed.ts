import "dotenv/config";
import { hash } from "bcryptjs";
import { ItemType, PaymentMethod, Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const catalog = [
  ["p1", "Hilot Massage — 60 min", "SVC-HILOT60", "cat-massage", "SERVICE", 280, 850, 0, 0],
  ["p2", "Swedish Massage — 60 min", "SVC-SWD60", "cat-massage", "SERVICE", 250, 750, 0, 0],
  ["p3", "Ventosa Therapy", "SVC-VNT45", "cat-therapy", "SERVICE", 220, 650, 0, 0],
  ["p4", "Foot Spa & Scrub", "SVC-FTSP", "cat-body", "SERVICE", 160, 480, 0, 0],
  ["p5", "Calamansi Body Oil", "RTL-CBO100", "cat-retail", "PRODUCT", 145, 320, 18, 6],
  ["p6", "Lavender Massage Balm", "RTL-LMB50", "cat-retail", "PRODUCT", 110, 260, 4, 5],
  ["p7", "Eucalyptus Room Mist", "RTL-ERM100", "cat-aroma", "PRODUCT", 125, 290, 11, 5],
  ["p8", "Lemongrass Soy Candle", "RTL-LSC180", "cat-aroma", "PRODUCT", 190, 420, 3, 5],
  ["p9", "Herbal Bath Salts", "RTL-HBS250", "cat-body", "PRODUCT", 95, 230, 22, 8],
  ["p10", "Couples Wellness Package", "PKG-CWP90", "cat-package", "SERVICE", 650, 1850, 0, 0],
  ["p11", "Ginger Relief Liniment", "RTL-GRL60", "cat-retail", "PRODUCT", 80, 195, 6, 6],
  ["p12", "Hot Stone Add-on", "ADD-HSTONE", "cat-addon", "SERVICE", 70, 220, 0, 0],
] as const;

const customerData = [
  ["c1", "Camille Reyes", "+63 917 524 1186", "camille.reyes@email.com", "Prefers medium pressure."],
  ["c2", "Patricia Lim", "+63 905 336 7421", "patricia.lim@email.com", "Usually books on weekends."],
  ["c3", "Jonas Villanueva", "+63 917 822 9045", "jonas.v@email.com", null],
  ["c4", "Mae Dizon", "+63 998 621 3370", "mae.dizon@email.com", "Regular retail customer."],
  ["c5", "Rafael Navarro", "+63 917 601 4332", "raf.navarro@email.com", null],
  ["c6", "Sofia Garcia", "+63 927 411 0874", "sofia.garcia@email.com", "Sensitive to strong scents."],
] as const;

async function main() {
  const demoPasswordHash = await hash("demo", 12);
  const staffPasswordHash = await hash("hiraya123", 12);
  const business = await prisma.business.upsert({ where: { slug: "hiraya-wellness" }, update: { name: "Demo" }, create: { id: "biz-hiraya", name: "Demo", slug: "hiraya-wellness" } });

  const owner = await prisma.user.upsert({ where: { id: "user-owner" }, update: { name: "Demo", email: "demo@tindahan.ph", passwordHash: demoPasswordHash }, create: { id: "user-owner", name: "Demo", email: "demo@tindahan.ph", passwordHash: demoPasswordHash } });
  const staff = await prisma.user.upsert({ where: { email: "staff@hiraya.ph" }, update: { name: "Lea Mendoza", passwordHash: staffPasswordHash }, create: { id: "user-staff", name: "Lea Mendoza", email: "staff@hiraya.ph", passwordHash: staffPasswordHash } });
  await prisma.membership.upsert({ where: { userId_businessId: { userId: owner.id, businessId: business.id } }, update: { role: "OWNER" }, create: { userId: owner.id, businessId: business.id, role: "OWNER" } });
  await prisma.membership.upsert({ where: { userId_businessId: { userId: staff.id, businessId: business.id } }, update: { role: "STAFF" }, create: { userId: staff.id, businessId: business.id, role: "STAFF" } });

  await prisma.businessSettings.upsert({ where: { businessId: business.id }, update: { logo: "/tindahan-logo.png" }, create: { businessId: business.id, address: "28 Acacia Street, Brgy. Kapitolyo, Pasig City", phone: "+63 917 555 0142", email: "hello@hirayawellness.ph", logo: "/tindahan-logo.png", currency: "PHP", taxPercentage: 12, receiptFooter: "Salamat sa pagtangkilik! We hope to see you again soon.", businessType: "Wellness studio & retail", templateId: "SALON", subscriptionPlan: "Salon Single Template", subscriptionStatus: "ACTIVE", entitledTemplates: ["SALON"] } });

  const categories = [
    ["cat-massage", "Massage", 1], ["cat-therapy", "Therapy", 2], ["cat-body", "Body Care", 3], ["cat-retail", "Wellness Retail", 4], ["cat-aroma", "Aromatherapy", 5], ["cat-package", "Packages", 6], ["cat-addon", "Add-ons", 7],
  ] as const;
  for (const [id, name, sortOrder] of categories) await prisma.category.upsert({ where: { id }, update: { name, sortOrder }, create: { id, businessId: business.id, name, sortOrder } });

  for (const [id, name, sku, categoryId, type, cost, price, stock, lowStockThreshold] of catalog) {
    await prisma.product.upsert({ where: { id }, update: { name, sku, categoryId, type: type as ItemType, cost, price, lowStockThreshold, templateSource: "USER:SALON" }, create: { id, businessId: business.id, name, sku, categoryId, type: type as ItemType, cost, price, stock, lowStockThreshold, templateSource: "USER:SALON" } });
  }

  for (const [id, name, phone, email, notes] of customerData) await prisma.customer.upsert({ where: { id }, update: { name, phone, email, notes }, create: { id, businessId: business.id, name, phone, email, notes } });

  const openingCount = await prisma.inventoryMovement.count({ where: { businessId: business.id, type: "OPENING_STOCK" } });
  if (!openingCount) {
    for (const [id, , , , type, , , stock] of catalog) if (type === "PRODUCT") await prisma.inventoryMovement.create({ data: { businessId: business.id, productId: id, createdById: owner.id, type: "OPENING_STOCK", quantity: stock, stockBefore: 0, stockAfter: stock, reason: "Initial demo inventory" } });
  }

  const saleSeeds = [
    { receipt: "HY-260822-0145", customerId: "c3", staffId: owner.id, method: "CASH", date: new Date("2026-08-22T01:21:00+08:00"), items: [["p1", 1], ["p12", 1]] },
    { receipt: "HY-260822-0146", customerId: "c2", staffId: staff.id, method: "CARD", date: new Date("2026-08-22T01:54:00+08:00"), items: [["p2", 1], ["p9", 1]] },
    { receipt: "HY-260822-0147", customerId: null, staffId: owner.id, method: "CASH", date: new Date("2026-08-22T02:18:00+08:00"), items: [["p1", 1]] },
    { receipt: "HY-260822-0148", customerId: "c1", staffId: staff.id, method: "GCASH", date: new Date("2026-08-22T02:42:00+08:00"), items: [["p1", 1], ["p5", 1], ["p6", 1]] },
  ] as const;
  for (const sale of saleSeeds) {
    if (await prisma.transaction.findFirst({ where: { businessId: business.id, receiptNumber: sale.receipt } })) continue;
    const productIds = sale.items.map(([id]) => id);
    const products = await prisma.product.findMany({ where: { id: { in: [...productIds] } } });
    let subtotal = new Prisma.Decimal(0);
    const lines = sale.items.map(([id, quantity]) => { const product = products.find((item) => item.id === id)!; const lineTotal = product.price.mul(quantity); subtotal = subtotal.add(lineTotal); return { product, quantity, lineTotal }; });
    const tax = subtotal.mul(0.12).toDecimalPlaces(2); const total = subtotal.add(tax);
    await prisma.transaction.create({ data: { businessId: business.id, receiptNumber: sale.receipt, customerId: sale.customerId, staffId: sale.staffId, subtotal, discount: 0, tax, total, createdAt: sale.date, items: { create: lines.map(({ product, quantity, lineTotal }) => ({ productId: product.id, name: product.name, sku: product.sku, type: product.type, quantity, unitPrice: product.price, unitCost: product.cost, lineTotal })) }, payments: { create: { method: sale.method as PaymentMethod, amount: total, amountReceived: total, change: 0 } } } });
  }

  console.log("Seeded Hiraya Wellness demo workspace.");
  console.log("Owner: demo / demo (stored as demo@tindahan.ph)");
  console.log("Staff: staff@hiraya.ph / hiraya123");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());

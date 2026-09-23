import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Hard-reset a single workspace to a clean slate so the owner starts fresh:
 * deletes all products, categories, customers, transactions, inventory and
 * ingredient history, appointments and job orders — while KEEPING the business,
 * its users/memberships, and its settings (branding, tax, template).
 *
 * Irreversible. Requires an explicit target and confirmation:
 *   RESET_BUSINESS="<slug | owner-email | business-id>" RESET_CONFIRM="YES" npm run db:reset-workspace
 */

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const target = process.env.RESET_BUSINESS?.trim();
  if (!target) throw new Error('Set RESET_BUSINESS to a business slug, owner email, or id.');

  const business = await prisma.business.findFirst({
    where: { OR: [{ id: target }, { slug: target }, { memberships: { some: { role: "OWNER", user: { email: target.toLowerCase() } } } }] },
    include: { memberships: { include: { user: { select: { email: true } } } } },
  });
  if (!business) throw new Error(`No business matched "${target}".`);

  const businessId = business.id;
  const counts = {
    products: await prisma.product.count({ where: { businessId } }),
    categories: await prisma.category.count({ where: { businessId } }),
    customers: await prisma.customer.count({ where: { businessId } }),
    transactions: await prisma.transaction.count({ where: { businessId } }),
    movements: await prisma.inventoryMovement.count({ where: { businessId } }),
  };

  console.log(`Target: ${business.name} (slug: ${business.slug}, id: ${businessId})`);
  console.log(`Owners: ${business.memberships.filter((m) => m.role === "OWNER").map((m) => m.user.email).join(", ")}`);
  console.log(`Will delete →`, counts);

  if (process.env.RESET_CONFIRM !== "YES") {
    console.log('\nDry run. Re-run with RESET_CONFIRM="YES" to actually wipe this workspace.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { businessId } });     // cascades payments + transaction items
    await tx.appointment.deleteMany({ where: { businessId } });
    await tx.jobOrder.deleteMany({ where: { businessId } });
    await tx.inventoryMovement.deleteMany({ where: { businessId } });
    await tx.ingredientMovement.deleteMany({ where: { businessId } });
    await tx.product.deleteMany({ where: { businessId } });     // cascades recipe items (RecipeItem)
    await tx.ingredient.deleteMany({ where: { businessId } });
    await tx.category.deleteMany({ where: { businessId } });
    await tx.customer.deleteMany({ where: { businessId } });
  });

  console.log(`\n✔ Workspace reset. ${business.name} now starts fresh (business, users, and settings kept).`);
}

main()
  .catch((error) => { console.error("✖ Reset failed:", error instanceof Error ? error.message : error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

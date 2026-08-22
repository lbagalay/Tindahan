import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { businessTemplateIds, businessTemplates, type BusinessTemplateId } from "@/lib/platform-config";

export async function applyBusinessTemplateForBusiness({ businessId, userId, templateId }: { businessId: string; userId: string; templateId: BusinessTemplateId }) {
  const template = businessTemplates[templateId];

  await prisma.$transaction(async (tx) => {
    await tx.businessSettings.update({
      where: { businessId },
      data: {
        templateId: template.id,
        businessType: template.businessType,
        enabledModules: template.modules as Prisma.InputJsonValue,
        featureFlags: template.features as Prisma.InputJsonValue,
        terminology: template.terminology as Prisma.InputJsonValue,
        dashboardWidgets: template.dashboardWidgets,
      },
    });

    await tx.product.updateMany({
      where: { businessId, templateSource: { in: [...businessTemplateIds] } },
      data: { status: "INACTIVE" },
    });

    for (const [sortOrder, name] of template.suggestedCategories.entries()) {
      await tx.category.upsert({
        where: { businessId_name: { businessId, name } },
        update: {},
        create: { businessId, name, sortOrder },
      });
    }

    for (const [sortOrder, sample] of template.sampleCatalog.entries()) {
      const category = await tx.category.upsert({
        where: { businessId_name: { businessId, name: sample.category } },
        update: {},
        create: { businessId, name: sample.category, sortOrder },
      });
      const existing = await tx.product.findUnique({
        where: { businessId_sku: { businessId, sku: sample.sku } },
        select: { id: true, templateSource: true },
      });
      if (existing?.templateSource === template.id) {
        await tx.product.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
        continue;
      }
      if (existing) continue;

      const product = await tx.product.create({
        data: {
          businessId,
          categoryId: category.id,
          name: sample.name,
          sku: sample.sku,
          type: sample.type,
          cost: sample.cost,
          price: sample.price,
          stock: sample.type === "PRODUCT" ? sample.stock : 0,
          lowStockThreshold: sample.type === "PRODUCT" ? sample.lowStockThreshold : 0,
          templateSource: template.id,
        },
      });
      if (product.type === "PRODUCT" && product.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            businessId,
            productId: product.id,
            createdById: userId,
            type: "OPENING_STOCK",
            quantity: product.stock,
            stockBefore: 0,
            stockAfter: product.stock,
            reason: `${template.name} template sample stock`,
          },
        });
      }
    }
  });
}

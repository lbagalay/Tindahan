import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolvePlatformConfig, templateCatalogScope, type PlatformConfig } from "@/lib/platform-config";

/**
 * Cached, per-business read layer.
 *
 * These reads run on every dashboard navigation (the layout and platform config
 * are evaluated for every route), so hitting Postgres each time is the dominant
 * source of per-click latency — especially while the database and the serverless
 * functions live in different regions. Wrapping them in `unstable_cache` serves
 * repeat navigations from Next's Data Cache instead of the database.
 *
 * Invalidation is coarse on purpose: every cached read for a business shares one
 * tag (`biz:<id>`), and every mutating server action calls `revalidateBusiness`,
 * so a write always clears that business's cached reads. Short `revalidate` TTLs
 * are a safety net in case any mutation path is ever missed.
 */

export function businessTag(businessId: string): string {
  return `biz:${businessId}`;
}

/** Clear all cached reads for a business. Call from every mutating server action. */
export function revalidateBusiness(businessId: string): void {
  // "max" = stale-while-revalidate (the non-deprecated Next 16 signature): the tag is
  // marked stale and refreshed in the background on the next visit to a tagged page.
  revalidateTag(businessTag(businessId), "max");
}

const CHROME_SETTINGS_SELECT = {
  currency: true,
  logo: true,
  workspaceName: true,
  workspaceTagline: true,
  brandColor: true,
  brandDarkColor: true,
  brandSoftColor: true,
  sidebarColor: true,
  templateId: true,
  enabledModules: true,
  featureFlags: true,
  terminology: true,
} as const;

/** Business name + settings needed to render the app shell (dashboard layout). */
export function getBusinessChrome(businessId: string) {
  return unstable_cache(
    async () =>
      prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, settings: { select: CHROME_SETTINGS_SELECT } },
      }),
    ["business-chrome", businessId],
    { tags: [businessTag(businessId)], revalidate: 300 },
  )();
}

/** Low-stock badge count for the sidebar. Changes on sales/restocks → shorter TTL. */
export function getLowStockCount(
  businessId: string,
  templateId: Parameters<typeof templateCatalogScope>[0],
): Promise<number> {
  return unstable_cache(
    async () =>
      prisma.product.count({
        where: {
          businessId,
          type: "PRODUCT",
          status: "ACTIVE",
          stock: { lte: prisma.product.fields.lowStockThreshold },
          ...templateCatalogScope(templateId),
        },
      }),
    ["low-stock-count", businessId, templateId],
    { tags: [businessTag(businessId)], revalidate: 60 },
  )();
}

/** Platform config (modules, terminology, template) — read by every page. */
export function getCachedPlatformConfig(businessId: string): Promise<PlatformConfig> {
  return unstable_cache(
    async () => {
      const settings = await prisma.businessSettings.findUnique({
        where: { businessId },
        select: { templateId: true, enabledModules: true, featureFlags: true, terminology: true },
      });
      return resolvePlatformConfig(settings);
    },
    ["platform-config", businessId],
    { tags: [businessTag(businessId)], revalidate: 300 },
  )();
}

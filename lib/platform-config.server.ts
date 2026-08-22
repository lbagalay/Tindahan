import { prisma } from "@/lib/prisma";
import { resolvePlatformConfig, type ModuleKey, type PlatformConfig } from "@/lib/platform-config";

export async function getBusinessPlatformConfig(businessId: string): Promise<PlatformConfig> {
  const settings = await prisma.businessSettings.findUnique({
    where: { businessId },
    select: { templateId: true, enabledModules: true, featureFlags: true, terminology: true },
  });
  return resolvePlatformConfig(settings);
}

export async function businessHasModule(businessId: string, module: ModuleKey): Promise<boolean> {
  return (await getBusinessPlatformConfig(businessId)).modules[module];
}

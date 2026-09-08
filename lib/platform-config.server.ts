import { type ModuleKey, type PlatformConfig } from "@/lib/platform-config";
import { getCachedPlatformConfig } from "@/lib/queries";

export async function getBusinessPlatformConfig(businessId: string): Promise<PlatformConfig> {
  return getCachedPlatformConfig(businessId);
}

export async function businessHasModule(businessId: string, module: ModuleKey): Promise<boolean> {
  return (await getBusinessPlatformConfig(businessId)).modules[module];
}

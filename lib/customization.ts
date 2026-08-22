export const dashboardWidgetKeys = ["metrics", "salesChart", "lowStock", "recentTransactions", "bestSellers"] as const;
export type DashboardWidgetKey = typeof dashboardWidgetKeys[number];
export type ReceiptLayout = "COMPACT" | "DETAILED";
export type { ModuleSettings } from "@/lib/platform-config";
export type CustomFieldType = "text" | "number" | "date" | "select";
export type CustomFieldDefinition = { id: string; label: string; type: CustomFieldType; required: boolean; options: string[] };

export const defaultDashboardWidgets: DashboardWidgetKey[] = [...dashboardWidgetKeys];

export function readDashboardWidgets(value: unknown): DashboardWidgetKey[] {
  if (!Array.isArray(value)) return defaultDashboardWidgets;
  return dashboardWidgetKeys.filter((key) => value.includes(key));
}

export { defaultModules, readModuleSettings as readModules } from "@/lib/platform-config";

export function readCustomFields(value: unknown): CustomFieldDefinition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return [];
    const field = candidate as Record<string, unknown>;
    if (typeof field.id !== "string" || typeof field.label !== "string" || !["text", "number", "date", "select"].includes(String(field.type))) return [];
    return [{ id: field.id, label: field.label, type: field.type as CustomFieldType, required: field.required === true, options: Array.isArray(field.options) ? field.options.filter((option): option is string => typeof option === "string") : [] }];
  });
}

export function readCustomValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => typeof item === "string" || typeof item === "number" ? [[key, String(item)]] : []));
}

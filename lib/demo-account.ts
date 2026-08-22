export const DEMO_LOGIN = "demo";
export const DEMO_EMAIL = "demo@tindahan.ph";
export const DEMO_PASSWORD = "demo";

export function resolveLoginEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return normalized === DEMO_LOGIN ? DEMO_EMAIL : normalized;
}

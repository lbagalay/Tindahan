export type DashboardWidgetKey = "metrics" | "salesChart" | "lowStock" | "recentTransactions" | "bestSellers";
const defaultDashboardWidgets: DashboardWidgetKey[] = ["metrics", "salesChart", "lowStock", "recentTransactions", "bestSellers"];

export const businessTemplateIds = ["CUSTOM", "RETAIL", "CAFE", "SALON", "MOTORSHOP", "SERVICE"] as const;
export type BusinessTemplateId = typeof businessTemplateIds[number];

export const moduleKeys = ["dashboard", "pos", "catalog", "inventory", "customers", "transactions", "reports", "appointments", "jobOrders"] as const;
export type ModuleKey = typeof moduleKeys[number];
export type ModuleSettings = Record<ModuleKey, boolean>;

export const featureFlagKeys = ["inventoryTracking", "services", "customerCRM", "appointments", "jobOrders", "variants", "modifiers", "commissions", "vehicles", "serviceHistory"] as const;
export type FeatureFlagKey = typeof featureFlagKeys[number];
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const terminologyKeys = ["catalog", "product", "products", "service", "services", "category", "categories", "customer", "customers", "staff", "transaction", "transactions", "inventory", "appointment", "appointments", "jobOrder", "jobOrders", "pointOfSale"] as const;
export type TerminologyKey = typeof terminologyKeys[number];
export type Terminology = Record<TerminologyKey, string>;

export type BusinessTemplate = {
  id: BusinessTemplateId;
  name: string;
  description: string;
  businessType: string;
  modules: ModuleSettings;
  features: FeatureFlags;
  terminology: Terminology;
  dashboardWidgets: DashboardWidgetKey[];
  suggestedCategories: string[];
  examples: TemplateExamples;
  sampleCatalog: TemplateCatalogItem[];
};

export type TemplateCatalogItem = {
  name: string;
  sku: string;
  category: string;
  type: "PRODUCT" | "SERVICE";
  cost: number;
  price: number;
  stock: number;
  lowStockThreshold: number;
};

export type TemplateExamples = {
  catalogItem: string;
  sku: string;
  category: string;
  customerName: string;
  customerNotes: string;
  appointmentTitle: string;
  jobOrderTitle: string;
  jobOrderDescription: string;
  inventoryReason: string;
};

export type PlatformConfig = {
  templateId: BusinessTemplateId;
  modules: ModuleSettings;
  features: FeatureFlags;
  terminology: Terminology;
  examples: TemplateExamples;
};

export type TemplateSubscription = {
  plan: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED";
  templateIds: BusinessTemplateId[];
};

export const defaultTemplateExamples: TemplateExamples = {
  catalogItem: "Sample product or service",
  sku: "ITEM-001",
  category: "General",
  customerName: "Customer name",
  customerNotes: "Preferences, reminders, or important context",
  appointmentTitle: "Service appointment",
  jobOrderTitle: "Service request",
  jobOrderDescription: "Describe the requested work and important details",
  inventoryReason: "Supplier delivery or stock correction",
};

export const defaultModules: ModuleSettings = {
  dashboard: true,
  pos: true,
  catalog: true,
  inventory: true,
  customers: true,
  transactions: true,
  reports: true,
  appointments: false,
  jobOrders: false,
};

export const defaultFeatures: FeatureFlags = {
  inventoryTracking: true,
  services: true,
  customerCRM: true,
  appointments: false,
  jobOrders: false,
  variants: false,
  modifiers: false,
  commissions: false,
  vehicles: false,
  serviceHistory: false,
};

export const defaultTerminology: Terminology = {
  catalog: "Products & services",
  product: "Product",
  products: "Products",
  service: "Service",
  services: "Services",
  category: "Category",
  categories: "Categories",
  customer: "Customer",
  customers: "Customers",
  staff: "Staff",
  transaction: "Transaction",
  transactions: "Transactions",
  inventory: "Inventory",
  appointment: "Appointment",
  appointments: "Appointments",
  jobOrder: "Job order",
  jobOrders: "Job orders",
  pointOfSale: "Point of sale",
};

function modules(overrides: Partial<ModuleSettings> = {}): ModuleSettings {
  return { ...defaultModules, ...overrides };
}

function features(overrides: Partial<FeatureFlags> = {}): FeatureFlags {
  return { ...defaultFeatures, ...overrides };
}

function terms(overrides: Partial<Terminology> = {}): Terminology {
  return { ...defaultTerminology, ...overrides };
}

export const businessTemplates: Record<BusinessTemplateId, BusinessTemplate> = {
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom business",
    description: "Start with the complete Tindahan core and choose the workflows and language that fit your operation.",
    businessType: "Custom business",
    modules: modules(),
    features: features(),
    terminology: terms(),
    dashboardWidgets: [...defaultDashboardWidgets],
    suggestedCategories: [],
    examples: defaultTemplateExamples,
    sampleCatalog: [],
  },
  RETAIL: {
    id: "RETAIL",
    name: "Retail store",
    description: "Products, stock control, customers, checkout, transactions, and sales reporting.",
    businessType: "Retail",
    modules: modules(),
    features: features({ services: false, variants: true }),
    terminology: terms({ catalog: "Products", service: "Service", services: "Services" }),
    dashboardWidgets: [...defaultDashboardWidgets],
    suggestedCategories: ["General", "New arrivals", "Promotions"],
    examples: { catalogItem: "Classic cotton T-shirt", sku: "RTL-TSHIRT-BLK-M", category: "Apparel", customerName: "Ana Reyes", customerNotes: "Preferred size, color, or loyalty notes", appointmentTitle: "Personal shopping appointment", jobOrderTitle: "Special product order", jobOrderDescription: "Requested item, size, color, and fulfillment details", inventoryReason: "Supplier delivery or physical stock count" },
    sampleCatalog: [
      { name: "Classic cotton T-shirt", sku: "RTL-TSHIRT-BLK-M", category: "Apparel", type: "PRODUCT", cost: 180, price: 399, stock: 25, lowStockThreshold: 5 },
      { name: "Canvas tote bag", sku: "RTL-TOTE-NAT", category: "Accessories", type: "PRODUCT", cost: 110, price: 249, stock: 18, lowStockThreshold: 5 },
      { name: "Stainless water bottle", sku: "RTL-BTL750", category: "General", type: "PRODUCT", cost: 220, price: 499, stock: 14, lowStockThreshold: 4 },
      { name: "Gift wrapping", sku: "SVC-GIFTWRAP", category: "Services", type: "SERVICE", cost: 15, price: 50, stock: 0, lowStockThreshold: 0 },
    ],
  },
  CAFE: {
    id: "CAFE",
    name: "Cafe or food shop",
    description: "A counter-first workspace with menu language, modifiers, inventory, and daily sales insights.",
    businessType: "Cafe / Food shop",
    modules: modules(),
    features: features({ services: false, variants: true, modifiers: true }),
    terminology: terms({ catalog: "Menu", product: "Menu item", products: "Menu items", category: "Menu category", categories: "Menu categories", customer: "Guest", customers: "Guests", transaction: "Order", transactions: "Orders", pointOfSale: "Counter" }),
    dashboardWidgets: ["metrics", "salesChart", "recentTransactions", "bestSellers", "lowStock"],
    suggestedCategories: ["Meals", "Drinks", "Snacks", "Add-ons"],
    examples: { catalogItem: "Iced Spanish Latte", sku: "DRK-ISL16", category: "Drinks", customerName: "Miguel Santos", customerNotes: "No sugar, oat milk, or favorite order", appointmentTitle: "Table reservation", jobOrderTitle: "Catering order", jobOrderDescription: "Menu selection, servings, delivery time, and dietary notes", inventoryReason: "Coffee bean or milk delivery" },
    sampleCatalog: [
      { name: "Iced Spanish Latte", sku: "DRK-ISL16", category: "Drinks", type: "PRODUCT", cost: 65, price: 145, stock: 30, lowStockThreshold: 8 },
      { name: "Cafe Americano", sku: "DRK-AMER12", category: "Drinks", type: "PRODUCT", cost: 35, price: 90, stock: 40, lowStockThreshold: 10 },
      { name: "Chicken pesto sandwich", sku: "MEAL-CPS01", category: "Meals", type: "PRODUCT", cost: 82, price: 175, stock: 15, lowStockThreshold: 5 },
      { name: "Blueberry muffin", sku: "SNK-BM01", category: "Snacks", type: "PRODUCT", cost: 42, price: 95, stock: 20, lowStockThreshold: 6 },
    ],
  },
  SALON: {
    id: "SALON",
    name: "Salon or studio",
    description: "Services, appointments, clients, team workflows, checkout, and performance reporting.",
    businessType: "Salon / Studio",
    modules: modules({ appointments: true }),
    features: features({ appointments: true, commissions: true }),
    terminology: terms({ catalog: "Services & products", customer: "Client", customers: "Clients", staff: "Team", appointment: "Booking", appointments: "Bookings" }),
    dashboardWidgets: ["metrics", "salesChart", "recentTransactions", "bestSellers"],
    suggestedCategories: ["Hair", "Nails", "Skin", "Retail products"],
    examples: { catalogItem: "Hair color and treatment", sku: "SVC-HCT90", category: "Hair", customerName: "Sofia Cruz", customerNotes: "Style preferences, allergies, or treatment history", appointmentTitle: "Hair color appointment", jobOrderTitle: "Bridal package preparation", jobOrderDescription: "Selected services, assigned team, and preparation notes", inventoryReason: "Salon supply delivery" },
    sampleCatalog: [
      { name: "Signature haircut", sku: "SVC-HAIRCUT", category: "Hair", type: "SERVICE", cost: 120, price: 400, stock: 0, lowStockThreshold: 0 },
      { name: "Hair color and treatment", sku: "SVC-HCT90", category: "Hair", type: "SERVICE", cost: 480, price: 1500, stock: 0, lowStockThreshold: 0 },
      { name: "Classic manicure", sku: "SVC-MANI45", category: "Nails", type: "SERVICE", cost: 95, price: 350, stock: 0, lowStockThreshold: 0 },
      { name: "After-care shampoo", sku: "RTL-SHAMP250", category: "Retail products", type: "PRODUCT", cost: 180, price: 420, stock: 12, lowStockThreshold: 4 },
    ],
  },
  MOTORSHOP: {
    id: "MOTORSHOP",
    name: "Motorshop or repair shop",
    description: "Parts inventory, customer and vehicle-oriented service work, job orders, checkout, and reporting.",
    businessType: "Motorshop / Repair shop",
    modules: modules({ appointments: true, jobOrders: true }),
    features: features({ appointments: true, jobOrders: true, vehicles: true, serviceHistory: true }),
    terminology: terms({ catalog: "Parts & services", product: "Part", products: "Parts", customer: "Customer", customers: "Customers", appointment: "Service booking", appointments: "Service bookings", jobOrder: "Work order", jobOrders: "Work orders" }),
    dashboardWidgets: [...defaultDashboardWidgets],
    suggestedCategories: ["Parts", "Labor", "Maintenance", "Diagnostics"],
    examples: { catalogItem: "Front brake pad set", sku: "PRT-BRK-FRT", category: "Parts", customerName: "Carlo Mendoza", customerNotes: "Vehicle model, plate number, or service preference", appointmentTitle: "Preventive maintenance booking", jobOrderTitle: "Brake inspection and repair", jobOrderDescription: "Vehicle concern, diagnosis, required parts, and repair scope", inventoryReason: "Parts supplier delivery" },
    sampleCatalog: [
      { name: "Front brake pad set", sku: "PRT-BRK-FRT", category: "Parts", type: "PRODUCT", cost: 650, price: 1050, stock: 10, lowStockThreshold: 3 },
      { name: "Fully synthetic engine oil", sku: "PRT-OIL-1L", category: "Parts", type: "PRODUCT", cost: 320, price: 520, stock: 24, lowStockThreshold: 6 },
      { name: "Oil change service", sku: "SVC-OILCHANGE", category: "Maintenance", type: "SERVICE", cost: 120, price: 350, stock: 0, lowStockThreshold: 0 },
      { name: "Computer diagnostics", sku: "SVC-DIAG", category: "Diagnostics", type: "SERVICE", cost: 200, price: 600, stock: 0, lowStockThreshold: 0 },
    ],
  },
  SERVICE: {
    id: "SERVICE",
    name: "Service business",
    description: "A flexible service catalog with clients, appointments, checkout, transactions, and reports.",
    businessType: "Service business",
    modules: modules({ inventory: false, appointments: true }),
    features: features({ inventoryTracking: false, appointments: true }),
    terminology: terms({ catalog: "Services", product: "Offering", products: "Offerings", customer: "Client", customers: "Clients", appointment: "Appointment", appointments: "Appointments" }),
    dashboardWidgets: ["metrics", "salesChart", "recentTransactions", "bestSellers"],
    suggestedCategories: ["Consultation", "Standard services", "Packages"],
    examples: { catalogItem: "Business consultation — 60 min", sku: "SVC-CONS60", category: "Consultation", customerName: "Lea Dela Cruz", customerNotes: "Goals, preferred schedule, or service requirements", appointmentTitle: "Initial consultation", jobOrderTitle: "Client service request", jobOrderDescription: "Scope, deliverables, due date, and client requirements", inventoryReason: "Supply delivery or stock correction" },
    sampleCatalog: [
      { name: "Business consultation — 60 min", sku: "SVC-CONS60", category: "Consultation", type: "SERVICE", cost: 300, price: 1200, stock: 0, lowStockThreshold: 0 },
      { name: "Standard service package", sku: "SVC-STANDARD", category: "Standard services", type: "SERVICE", cost: 500, price: 2500, stock: 0, lowStockThreshold: 0 },
      { name: "Premium service package", sku: "SVC-PREMIUM", category: "Packages", type: "SERVICE", cost: 1000, price: 5000, stock: 0, lowStockThreshold: 0 },
      { name: "Follow-up session", sku: "SVC-FOLLOWUP", category: "Consultation", type: "SERVICE", cost: 150, price: 650, stock: 0, lowStockThreshold: 0 },
    ],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readTemplateId(value: unknown): BusinessTemplateId {
  return typeof value === "string" && businessTemplateIds.includes(value as BusinessTemplateId) ? value as BusinessTemplateId : "CUSTOM";
}

export function resolveTemplateSubscription(settings?: { templateId?: unknown; subscriptionPlan?: unknown; subscriptionStatus?: unknown; entitledTemplates?: unknown } | null): TemplateSubscription {
  const currentTemplate = readTemplateId(settings?.templateId);
  const configured = Array.isArray(settings?.entitledTemplates)
    ? settings.entitledTemplates.filter((value): value is BusinessTemplateId => typeof value === "string" && businessTemplateIds.includes(value as BusinessTemplateId))
    : [];
  return {
    plan: typeof settings?.subscriptionPlan === "string" && settings.subscriptionPlan.trim() ? settings.subscriptionPlan.trim() : "Single Template",
    status: settings?.subscriptionStatus === "PAST_DUE" || settings?.subscriptionStatus === "CANCELLED" ? settings.subscriptionStatus : "ACTIVE",
    // Existing businesses created before subscriptions keep access to their
    // current template until billing writes explicit entitlements.
    templateIds: [...new Set(configured.length ? configured : [currentTemplate])],
  };
}

export function userCatalogSource(templateId: BusinessTemplateId) {
  return `USER:${templateId}`;
}

/**
 * Untagged legacy records stay shared for backward compatibility. New
 * user-created records and generated samples are isolated to their template.
 */
export function templateCatalogScope(templateId: BusinessTemplateId) {
  return { OR: [{ templateSource: null }, { templateSource: templateId }, { templateSource: userCatalogSource(templateId) }] };
}

export function readModuleSettings(value: unknown, base: ModuleSettings = defaultModules): ModuleSettings {
  if (!isRecord(value)) return { ...base };
  return Object.fromEntries(moduleKeys.map((key) => [key, typeof value[key] === "boolean" ? value[key] : base[key]])) as ModuleSettings;
}

export function readFeatureFlags(value: unknown, base: FeatureFlags = defaultFeatures): FeatureFlags {
  if (!isRecord(value)) return { ...base };
  return Object.fromEntries(featureFlagKeys.map((key) => [key, typeof value[key] === "boolean" ? value[key] : base[key]])) as FeatureFlags;
}

export function readTerminology(value: unknown, base: Terminology = defaultTerminology): Terminology {
  if (!isRecord(value)) return { ...base };
  return Object.fromEntries(terminologyKeys.map((key) => [key, typeof value[key] === "string" && value[key].trim() ? String(value[key]).trim() : base[key]])) as Terminology;
}

export function resolvePlatformConfig(settings?: { templateId?: unknown; enabledModules?: unknown; featureFlags?: unknown; terminology?: unknown } | null): PlatformConfig {
  const templateId = readTemplateId(settings?.templateId);
  const template = businessTemplates[templateId];
  const modules = readModuleSettings(settings?.enabledModules, template.modules);
  const features = readFeatureFlags(settings?.featureFlags, template.features);
  const savedFeatures = isRecord(settings?.featureFlags) ? settings.featureFlags : {};
  // Settings written before generalized feature flags existed used module flags
  // directly. Infer their matching capabilities until the owner saves explicit
  // feature choices, preserving existing appointment and job-order behavior.
  if (typeof savedFeatures.appointments !== "boolean") features.appointments = modules.appointments;
  if (typeof savedFeatures.jobOrders !== "boolean") features.jobOrders = modules.jobOrders;
  if (typeof savedFeatures.inventoryTracking !== "boolean") features.inventoryTracking = modules.inventory;
  return {
    templateId,
    modules,
    features: { ...features, appointments: modules.appointments && features.appointments, jobOrders: modules.jobOrders && features.jobOrders, inventoryTracking: modules.inventory && features.inventoryTracking },
    terminology: readTerminology(settings?.terminology, template.terminology),
    examples: template.examples,
  };
}

export function isModuleEnabled(settings: Parameters<typeof resolvePlatformConfig>[0], module: ModuleKey): boolean {
  return resolvePlatformConfig(settings).modules[module];
}

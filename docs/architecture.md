# Tindahan POS architecture

## Product boundaries

- `Business` is the tenant boundary. Every mutable business record carries a `businessId`.
- `Membership` joins users to businesses and defines their role.
- `TransactionItem` stores product/service snapshots so old receipts never change when the catalog does.
- `InventoryMovement` is the stock audit trail. Stock changes and movements are written in the same database transaction.
- `Payment` is separate from `Transaction`, leaving room for split payments and refunds.
- Business configuration lives in `BusinessSettings`, not application constants.
- `lib/platform-config.ts` is the versioned template catalog and configuration resolver. Runtime behavior checks resolved modules and feature flags rather than branching on a business type.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Credential sign-in |
| `/` | Business dashboard |
| `/pos` | Cashier workspace |
| `/products` | Product and service catalog |
| `/inventory` | Stock status and movement history |
| `/customers` | Customer directory and purchase summaries |
| `/transactions` | Sales history and receipt drill-down |
| `/transactions/[id]` | Complete transaction record |
| `/reports` | Sales and inventory reporting |
| `/appointments` | Optional appointment scheduling workflow |
| `/job-orders` | Optional work-order tracking workflow |
| `/settings` | Business details, templates, modules, terminology, features, branding, and receipts |

## Extension seams

Workspace sections are controlled by `BusinessSettings.enabledModules`. Appointments and job orders are isolated domain records that reference `Business`, `Customer`, `User`, and `Product` without changing the checkout ledger. Primary pages and their mutations check resolved module configuration, so hidden modules are not merely removed from navigation.

Brand colors, workspace labels, receipt format, dashboard visibility, and custom-field definitions live in `BusinessSettings`. Product and customer custom-field values are stored as JSON on their respective records so each business can evolve its fields without schema changes.

## Template-driven configuration

`BusinessSettings.templateId` records the chosen starting template. The code-defined catalog currently includes Custom, Retail, Cafe, Salon, Motorshop, and Service templates. Each template supplies module defaults, terminology, feature flags, dashboard widgets, and non-destructive suggested categories.

Saved `enabledModules`, `featureFlags`, and `terminology` values are merged with template defaults by `resolvePlatformConfig`. This merge is the backward-compatibility boundary: settings written before generalized modules existed continue to enable all original core pages while retaining their appointment and job-order choices.

Templates are defaults, not permanent business-type branches. Owners can override modules, capability flags, and labels after applying a template. Future workflows should check a module or feature flag and use resolved terminology instead of checking `businessType` or `templateId` directly.

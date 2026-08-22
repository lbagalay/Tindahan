# Tindahan platform audit

This audit compares the existing project with `docs/VISION.md` and records the incremental implementation choices made to preserve current businesses and data.

## What already supported the vision

- `Business` and `businessId` already provide a consistent tenant boundary.
- `BusinessSettings` already centralizes branding, receipts, dashboard widgets, custom fields, and the first optional module flags.
- Products and services already share one catalog while retaining a type distinction.
- Appointments and job orders are isolated optional domains connected to the existing customer, staff, and catalog records.
- Transaction item snapshots and inventory movements preserve historical accuracy.
- Existing actions consistently scope writes to the signed-in business.

## Gaps found

- There was no formal business-template catalog or selected template identifier.
- `enabledModules` understood only appointments and job orders; core sections could not be configured.
- Labels such as customer, product, appointment, and transaction were hardcoded.
- There was no generalized feature-flag configuration.
- Module visibility was mostly a sidebar concern rather than a route and server-action boundary.

## Implemented foundation

- Added versioned, code-defined templates for Custom, Retail, Cafe, Salon, Motorshop, and Service businesses.
- Added `templateId`, `featureFlags`, and `terminology` to `BusinessSettings` and generalized `enabledModules`.
- Added a resolver that merges template defaults with saved overrides. Old `{ appointments, jobOrders }` JSON remains valid and receives enabled defaults for every existing core module.
- Added owner controls for applying templates, enabling modules, setting feature flags, and editing terminology.
- Applying a template updates configuration and only upserts missing suggested categories. It never deletes or renames existing categories and never changes products, customers, appointments, job orders, or transactions.
- Applied module configuration to navigation, primary route guards, and mutation guards.
- Applied terminology to global navigation/search and the main module page surfaces.

## Deliberate compatibility choices

- Existing businesses default to `CUSTOM`; no niche template is inferred from their current `businessType`.
- Templates live in TypeScript rather than a database table for now. This keeps template definitions reviewable and versioned while business-specific overrides remain in the database.
- Existing operational models were reused. No transaction, inventory, customer, appointment, or job-order schema was rebuilt.
- Feature flags for future workflows such as variants, modifiers, commissions, vehicles, and service history are configuration-ready but do not claim that those domain models are implemented yet.

## Recommended next increments

1. Add product variants and cafe modifiers behind their existing feature flags.
2. Add staff management and permissions as a first-class module.
3. Add vehicle records and service history for motorshop workflows.
4. Add guided template selection to business onboarding.
5. Add integration tests covering module guards and template application against a disposable test database.

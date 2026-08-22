# Tindahan Business Platform

A configurable POS and business-management platform for Philippine small businesses. One shared core adapts to retail stores, cafes, salons, motorshops, and service businesses through templates, modules, feature flags, terminology, and business-specific settings.

## Run locally

1. Copy `.env.example` to `.env` and point `DATABASE_URL` to PostgreSQL.
2. Install packages with `npm install`.
3. Generate and initialize the database:

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. Start the application with `npm run dev`.

Demo login: `demo` / `demo`

## Included modules

- Owner and staff authentication
- Operational dashboard
- Fast POS checkout with receipt printing
- Products, services, and categories
- Inventory movements and low-stock monitoring
- Customer records and purchase metrics
- Transaction ledger and receipt detail
- Sales and stock reports
- Configurable business, tax, receipt, branding, theme, and dashboard settings
- Customer and product custom fields
- Optional appointments and job-order workflows
- Business templates for Retail, Cafe, Salon, Motorshop, Service, and Custom setups
- Configurable core and optional modules with route and mutation guards
- Per-business terminology such as customers/clients/guests and products/menu items/parts
- Feature-flag foundation for variants, modifiers, commissions, vehicles, and service history

See [the architecture notes](docs/architecture.md) for the tenant model and extension seams, and [the platform audit](docs/platform-audit.md) for the vision comparison and compatibility decisions.

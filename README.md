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

Demo login: `demo` / `demo`. The Demo All-Access plan includes all six business templates.

## Deploy to Vercel

Tindahan requires a hosted PostgreSQL database. A database running on `localhost` cannot be reached by Vercel.

1. Create or connect a hosted PostgreSQL database to the Vercel project.
2. In **Vercel → Project Settings → Environment Variables**, add these variables to both **Production** and **Preview**:

   - `DATABASE_URL` — the hosted PostgreSQL connection string
   - `AUTH_SECRET` — a random value containing at least 32 characters
   - `AUTH_TRUST_HOST` — `true`

   `.env.vercel.example` contains safe placeholders. Generate an auth secret locally with:

   ```bash
   openssl rand -base64 32
   ```

3. Apply the committed database migrations and seed the demo workspace once, using the hosted connection string in your local `.env`:

   ```bash
   npm ci
   npm run db:setup
   ```

   This creates the schema and the `demo` / `demo` account. Do not run `db:setup` during every Vercel build; database changes are intentionally kept separate from application compilation.

4. Import the GitHub repository into Vercel or redeploy the existing `tindahan` project. Vercel uses `npm ci`, validates its environment, generates Prisma Client, and builds Next.js from `vercel.json`.

5. After deployment, open `/login` and sign in with `demo` / `demo`.

For future schema changes, create a migration locally with `npm run db:migrate`, commit the generated migration, then run `npm run db:deploy` against the hosted database before deploying the corresponding application version.

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

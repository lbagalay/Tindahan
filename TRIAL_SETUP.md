# Cafe trial — go-live checklist

Steps to launch Tindahan for a real cafe (1-month trial). Do them in order.

## 1. Ship the production changes
Push the committed work so Vercel redeploys:
```bash
git push origin main
```
Included: sales retry (concurrent orders), clean login (no demo prefill), and the cafe setup script.

## 2. Confirm Vercel environment variables
In Vercel → `tindahan` → Settings → Environment Variables (Production):
- `DATABASE_URL` — Singapore Neon **pooled** endpoint ✅ (already connected)
- `DATABASE_URL_UNPOOLED` — Singapore Neon **direct** endpoint ✅
- `AUTH_SECRET` — a strong random value, **≥ 32 chars** (generate: `openssl rand -base64 32`). The build fails if it's missing/placeholder.
- `AUTH_TRUST_HOST` — `true`
- **Do NOT set** `NEXT_PUBLIC_DEMO_MODE` → this keeps the login screen clean (no demo hint/prefill). Set it to `true` only if you want the demo hint back.
- Confirm **Fluid Compute** is ON (Settings → Functions) to avoid cold starts.

## 3. Create the cafe's real workspace
Run once, locally, against the production (Singapore) DB — your `.env` already points there. Fill in the cafe's real details and **choose strong passwords** (they never touch the repo):
```bash
CAFE_NAME="Their Cafe Name" \
OWNER_NAME="Owner Full Name" OWNER_EMAIL="owner@theircafe.ph" OWNER_PASSWORD="<strong-owner-password>" \
CASHIER_NAME="Cashier" CASHIER_EMAIL="cashier@theircafe.ph" CASHIER_PASSWORD="<strong-cashier-password>" \
CAFE_CURRENCY="PHP" CAFE_TAX="0" \
CAFE_ADDRESS="Street, City" CAFE_PHONE="+63 9xx xxx xxxx" \
CAFE_RECEIPT_FOOTER="Salamat! Please come again." \
npm run db:setup-cafe
```
Notes:
- `CASHIER_*` is optional (owner-only if omitted).
- `CAFE_TAX` — set the cafe's real VAT rate, or `0` if not VAT-registered.
- Entitled to **CAFE only**, so logging in can never reshape/wipe their data.
- Comes with a small starter menu (Drinks/Meals/Snacks) they can edit or replace in **Menu**.
- The script is idempotent — safe to re-run to update names/passwords.

## 4. Verify the launch
Open the live URL and:
1. Sign in as the **owner** email + password → lands on the cafe workspace.
2. **Menu**: add/edit their real items (delete the starter samples they don't want).
3. **Counter**: ring up a test sale end-to-end (add items → Proceed to payment → complete). Confirm stock decrements and a receipt number is generated.
4. **Transactions**: open the sale, print the receipt (check the printout looks right).
5. **Reports**: confirm the sale appears.
6. Sign in as the **cashier** and confirm they see the counter but not owner-only settings.

## 5. Decide on the demo account (recommended)
The production DB currently also contains the seeded **demo** business (`demo / demo`). With `NEXT_PUBLIC_DEMO_MODE` off it's not advertised, and tenant isolation means demo users can't see cafe data — but the credentials are publicly known. For a pure production instance, delete the demo workspace once you no longer need it to show the friend around. (Ask and I'll add a safe cleanup step.)

## Operational notes for the month
- **Backups:** Neon Free keeps only a short restore-history window. For a month of real sales, either upgrade the Neon project for longer point-in-time restore, or periodically export:
  `pg_dump "$DATABASE_URL_UNPOOLED" -Fc -f backup-$(date +%F).dump`
- **Give the cafe the URL + their owner login.** Have them change nothing about the DB/env themselves.
- **If a sale ever errors**, it's safe to retry — sales run in a serializable transaction and now auto-retry on conflicts; nothing is half-written.

## Not included (optional, ask if you want them)
- Login rate-limiting (brute-force protection) — needs a small rate-limit store.
- Error monitoring (e.g. Sentry) so you see failures in production.
- Automated tests around the sale/stock logic.

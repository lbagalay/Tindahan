# Fix: whole app is slow — every feature lags on click

Instructions for Claude Code, grounded in this repo (Next.js App Router + NextAuth + Prisma/Postgres on Vercel). Verified against the code on 2026-09-08.

## Diagnosis (measured + confirmed in source)

The slowness is **100% server-side and app-wide**. The front-end bundle is fine (~23 KB transfer). Every route under `app/(dashboard)/` re-renders on the server on every click, hits Postgres each time, and never caches.

Live measurements (RSC navigation each sidebar click triggers, logged in as demo):

| Route | Cold | Warm | `x-vercel-cache` | `cache-control` |
|---|---|---|---|---|
| `/inventory` | **3.6 s** | 0.88 s | MISS | `no-store` |
| `/reports` | 1.07 s | 1.09 s | MISS | `no-store` |
| `/settings` | 0.79 s | 0.89 s | MISS | `no-store` |
| `/pos` | 0.78 s | 0.86 s | MISS | `no-store` |

Region is `sin1` (Singapore), single region, no edge cache.

### Confirmed root causes

1. **`export const dynamic = "force-dynamic"` in [`app/(dashboard)/layout.tsx:7`](app/(dashboard)/layout.tsx)** cascades to *every* dashboard route → `no-store` everywhere → Next's data cache is fully disabled, so identical per-business reads re-run on every navigation. (Also present in [`app/(dashboard)/transactions/page.tsx:8`](app/(dashboard)/transactions/page.tsx).)
2. **Un-pooled direct Postgres connection on serverless.** [`lib/prisma.ts`](lib/prisma.ts) uses `@prisma/adapter-pg` with a raw `connectionString`, and `.env.vercel.example` points `DATABASE_URL` at `HOST:5432?sslmode=require` — a direct connection, no pooler. Every new/cold serverless instance pays a fresh TCP+TLS+Postgres handshake → this is the ~3.6 s cold start, and it adds latency to every query.
3. **Redundant per-navigation DB round trips.** The dashboard layout runs on every navigation doing `business.findUnique` + `product.count`; each page then repeats its own queries + `getBusinessPlatformConfig`. `/reports` does the most work (heaviest at ~1.1 s).
4. **Possible DB↔function region mismatch.** Functions run in `sin1`. If Postgres lives elsewhere, every query round trip is transcontinental and the 2–3 queries per page multiply it.

### What is NOT the problem — do not touch
- The JS/CSS bundle (already lean).
- Auth cost: `auth.ts` uses `session: { strategy: "jwt" }`, so `auth()` verifies the cookie **without a DB hit**. Do **not** spend effort "moving auth to middleware for speed" — it isn't the bottleneck. The DB queries are.

---

## Task 1 — Add serverless connection pooling (biggest win: cold start + every query)

A direct 5432 connection is the wrong shape for serverless. Switch `DATABASE_URL` to a **pooled** endpoint and keep a direct URL for migrations. Pick whichever matches the hosting Postgres:

- **Supabase:** use the pooler host on port **6543** (transaction mode) for `DATABASE_URL`; keep the 5432 URL as `DIRECT_URL`.
- **Neon:** use the **`-pooler`** host for `DATABASE_URL`; direct host as `DIRECT_URL`.
- **Provider-agnostic:** **Prisma Accelerate** — `DATABASE_URL="prisma+postgres://accelerate..."`, add the `withAccelerate()` extension in `lib/prisma.ts`.

Then in [`prisma/schema.prisma`](prisma/schema.prisma) add `directUrl` to the datasource:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // direct, for migrate/introspect
}
```
Update `.env.vercel.example` and `.env.example` to document both vars, and set them in Vercel project env.

**Acceptance:** cold navigations drop dramatically (target: first-hit well under 1 s instead of ~3.6 s).

---

## Task 2 — Enable Fluid Compute

On the Vercel project: Settings → Functions → enable **Fluid Compute**. Keeps instances warm and reuses the DB connection across invocations. No code change. Pairs with Task 1 to kill cold starts.

---

## Task 3 — Co-locate the database and the function region

Functions run in `sin1`. Set the Vercel function region to the **same region as the Postgres DB** (or move/replicate the DB next to `sin1`). Add to [`vercel.json`](vercel.json):
```json
{ "regions": ["<db-region>"] }
```
2–3 queries per page × cross-region RTT is a large share of the ~0.8–1.1 s warm times. Verify where the DB actually lives before choosing the region.

---

## Task 4 — Cache per-business reads instead of `force-dynamic`

The dashboard data (business, settings, platform config, low-stock count, product catalog) is identical across navigations until a write. The app already calls `revalidatePath(...)` in every write action (`app/actions/*.ts`), so cache invalidation plumbing is half-built — extend it to tags.

1. Wrap the read queries in `unstable_cache` (or `revalidateTag`-tagged fetches) keyed by `businessId`, e.g. a `getBusinessChrome(businessId)` for the layout's business+settings+lowStockCount, and cache the product/customer reads used by `/pos`, `/inventory`, etc.
2. Tag them (e.g. `business:{id}`, `products:{id}`, `customers:{id}`).
3. In the existing write actions, add `revalidateTag(...)` alongside the current `revalidatePath(...)` calls so cached reads invalidate on mutation.
4. Dedupe the layout's and page's overlapping fetches within a request using React `cache()`.
5. Once reads are cached+tagged, **remove `export const dynamic = "force-dynamic"`** from [`app/(dashboard)/layout.tsx`](app/(dashboard)/layout.tsx) and [`app/(dashboard)/transactions/page.tsx`](app/(dashboard)/transactions/page.tsx). Pages still read the JWT session (so they stay dynamic-rendered) but their **data** now comes from cache — the DB is off the hot path on cache hits.

**Acceptance:** warm navigations between already-visited features feel instant; DB query count per navigation drops to ~0 on cache hits.

---

## Order of work
Task 1 → 2 → 3 remove the cold start and cut per-query latency and give the biggest felt improvement fastest. Task 4 is the deeper refactor that makes warm navigation instant. Do 1–3, re-measure, then decide how far to take 4.

## How to verify the whole fix
1. Deploy.
2. From cold (fresh preview URL or after idle), open `/pos`, `/inventory`, `/reports`, `/settings`. Each first paint should be well under 1 s; clicking between visited features should feel instant.
3. For each route, `curl -sI https://<deployment>/<route>` twice — after Task 4 the read data no longer forces `no-store`; before that, confirm cold-start time is gone from Tasks 1–3.
4. Re-check browser nav timing: the RSC navigation response should no longer dominate on any route.

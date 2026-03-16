# mosqueconnect

## Backend runtime (Vercel + Supabase)

This project now supports a backend repository layer that can run against:
1. **Supabase REST API** (preferred in Vercel), or
2. **in-memory fallback** (for local development if env vars/tables are not ready).

### 1) Configure environment variables

Copy `.env.example` to `.env.local` and set values.

Required for API routes to use Supabase:
- `STORAGE_SUPABASE_URL`
- `STORAGE_SUPABASE_SERVICE_ROLE_KEY`

Optional/public values for frontend:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Never commit real service-role keys into git.

### 2) Create database tables in Supabase

Run SQL in Supabase SQL editor:
- `supabase/schema.sql`

This creates tables used by:
- `/api/v1/mosques`
- `/api/v1/events`
- `/api/v1/announcements`
- `/api/v1/finance-records`
- `/api/v1/users`
- `/api/v1/shura/workflows`

### 3) Run locally

```bash
pnpm install
pnpm dev
```

If Supabase is unreachable or not configured, routes continue working using in-memory fallback.


## Auth rollout

The new authentication rollout checklist is documented in `docs/auth-rollout.md`.

Quick checklist:
1. Feature flag new auth.
2. Staging OAuth app configuration.
3. Seed/migrate users.
4. Monitor auth failure rates and denied-access logs.
5. Cutover and rollback strategy documented.

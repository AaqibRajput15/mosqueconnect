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


### OAuth configuration (Google + Microsoft)

Provider sign-in buttons on `/auth/sign-in` use OAuth Authorization Code + PKCE and require provider secrets.

Required for Google OAuth:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Required for Microsoft OAuth:
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`

Callback base URL used to build redirect URIs:
- `OAUTH_CALLBACK_BASE_URL` (example: `http://localhost:3000`)

If `OAUTH_CALLBACK_BASE_URL` is not set, the app falls back to `NEXT_PUBLIC_APP_URL` and then `http://localhost:3000`.

Register these callback URLs with providers:
- Google: `/api/auth/oauth/google/callback`
- Microsoft: `/api/auth/oauth/microsoft/callback`

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

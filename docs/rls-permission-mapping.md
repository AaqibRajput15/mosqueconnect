# RLS permission mapping

This document maps each permission in `lib/auth/permissions.ts` to the Supabase RLS policy names defined in `supabase/schema.sql`.

## Notes
- Policies are split by operation (`select`, `insert`, `update`, `delete`) and by role (`admin`, `shura`, `mosque_admin`, `member`).
- Cross-mosque access is denied by default through `can_access_mosque(...)`; only global admins (`role='admin'` and `mosque_id IS NULL`) can bypass mosque scoping.
- `visitor` permissions are enforced in app code only; there are no `visitor` SQL policies because RLS policies target authenticated users.

## Permission → policy mapping

| Permission | RLS policy names |
|---|---|
| `dashboard:view` | N/A (route-level/app guard only) |
| `mosques:read` | `mosques_select_admin`, `mosques_select_shura`, `mosques_select_mosque_admin`, `mosques_select_member` |
| `mosques:create` | `mosques_insert_admin` |
| `mosques:update` | `mosques_update_admin` |
| `mosques:delete` | `mosques_delete_admin` |
| `events:read` | `events_select_admin`, `events_select_shura`, `events_select_mosque_admin`, `events_select_member` |
| `events:create` | `events_insert_admin`, `events_insert_shura`, `events_insert_mosque_admin` |
| `events:update` | `events_update_admin`, `events_update_shura`, `events_update_mosque_admin` |
| `events:delete` | `events_delete_admin`, `events_delete_shura`, `events_delete_mosque_admin` |
| `announcements:read` | `announcements_select_admin`, `announcements_select_shura`, `announcements_select_mosque_admin`, `announcements_select_member` |
| `announcements:create` | `announcements_insert_admin`, `announcements_insert_shura`, `announcements_insert_mosque_admin` |
| `announcements:update` | `announcements_update_admin`, `announcements_update_shura`, `announcements_update_mosque_admin` |
| `announcements:delete` | `announcements_delete_admin`, `announcements_delete_shura`, `announcements_delete_mosque_admin` |
| `finance:read` | `finance_records_select_admin`, `finance_records_select_mosque_admin` |
| `finance:create` | `finance_records_insert_admin`, `finance_records_insert_mosque_admin` |
| `finance:update` | `finance_records_update_admin`, `finance_records_update_mosque_admin` |
| `finance:delete` | `finance_records_delete_admin`, `finance_records_delete_mosque_admin` |
| `users:read` | `users_select_admin`, `users_select_shura`, `users_select_mosque_admin` |
| `users:create` | `users_insert_admin` |
| `users:update` | `users_update_admin` |
| `users:delete` | `users_delete_admin` |
| `shura:read` | `shura_members_select_admin/shura`, `shura_visits_select_admin/shura`, `shura_meetings_select_admin/shura`, `shura_registrations_select_admin/shura`, `shura_assessments_select_admin/shura`, `shura_imam_appointments_select_admin/shura` |
| `shura:create` | `shura_members_insert_admin/shura`, `shura_visits_insert_admin/shura`, `shura_meetings_insert_admin/shura`, `shura_registrations_insert_admin/shura`, `shura_assessments_insert_admin/shura`, `shura_imam_appointments_insert_admin/shura` |
| `shura:update` | `shura_members_update_admin/shura`, `shura_visits_update_admin/shura`, `shura_meetings_update_admin/shura`, `shura_registrations_update_admin/shura`, `shura_assessments_update_admin/shura`, `shura_imam_appointments_update_admin/shura` |
| `shura:delete` | `shura_members_delete_admin/shura`, `shura_visits_delete_admin/shura`, `shura_meetings_delete_admin/shura`, `shura_registrations_delete_admin/shura`, `shura_assessments_delete_admin/shura`, `shura_imam_appointments_delete_admin/shura` |
| `audit:read` | `auth_sessions_select_admin`, `auth_identities_select_admin` |
| `audit:create` | `auth_sessions_insert_admin`, `auth_identities_insert_admin` |
| `audit:update` | `auth_sessions_update_admin`, `auth_identities_update_admin` |
| `audit:delete` | `auth_sessions_delete_admin`, `auth_identities_delete_admin` |

## Browser/service-role safety
- Service-role usage remains in server-only runtime modules (`lib/backend/*`, `lib/auth/audit-log.ts`).
- `lib/auth/supabase-auth.ts` now uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only for auth endpoints and no longer falls back to the service-role key.
- `lib/backend/config.ts` resolves `serviceRoleKey` only when running on the server (`typeof window === 'undefined'`).

-- Core tables for /api/v1 backend routes
create table if not exists mosques (
  id text primary key,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  country text not null,
  "zipCode" text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text not null,
  email text not null,
  website text,
  description text not null,
  "imageUrl" text not null,
  facilities text[] not null default '{}',
  capacity integer not null,
  "establishedYear" integer not null,
  "isVerified" boolean not null default false,
  "adminId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  "mosqueId" text not null,
  title text not null,
  description text not null,
  category text not null,
  "startDate" text not null,
  "endDate" text not null,
  "startTime" text not null,
  "endTime" text not null,
  location text not null,
  speaker text,
  "isRecurring" boolean not null,
  "recurrencePattern" text,
  "maxAttendees" integer,
  "currentAttendees" integer not null default 0,
  "imageUrl" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table if not exists announcements (
  id text primary key,
  "mosqueId" text not null,
  title text not null,
  content text not null,
  category text not null,
  "isPinned" boolean not null default false,
  "publishDate" text not null,
  "expiryDate" text,
  "authorName" text not null,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table if not exists finance_records (
  id text primary key,
  "mosqueId" text not null,
  type text not null,
  category text not null,
  amount numeric not null,
  description text not null,
  date text not null,
  "donorName" text,
  "isAnonymous" boolean not null default false,
  "receiptNumber" text,
  "createdAt" timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  email text not null,
  name text not null,
  role text not null,
  "mosqueId" text,
  "isActive" boolean not null default true,
  "onboardingCompleted" boolean not null default false,
  "defaultRedirectPath" text,
  "avatarUrl" text,
  phone text,
  "emailVerified" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists auth_identities (
  id bigserial primary key,
  "userId" text not null references users(id) on delete cascade,
  provider text not null,
  "providerUserId" text not null,
  email text,
  "emailVerified" boolean not null default false,
  "lastLoginAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  unique (provider, "providerUserId")
);

create index if not exists auth_identities_user_id_idx on auth_identities ("userId");
create index if not exists auth_identities_email_idx on auth_identities (email);

create table if not exists shura_members (id text primary key, payload jsonb not null);
create table if not exists shura_visits (id text primary key, payload jsonb not null);
create table if not exists shura_meetings (id text primary key, payload jsonb not null);
create table if not exists shura_registrations (id text primary key, payload jsonb not null);
create table if not exists shura_assessments (id text primary key, payload jsonb not null);
create table if not exists shura_imam_appointments (id text primary key, payload jsonb not null);

-- Durable authentication session storage
create extension if not exists pgcrypto;

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  provider text not null,
  session_token_hash text not null unique,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists auth_sessions_user_id_idx on auth_sessions (user_id);
create index if not exists auth_sessions_expires_at_idx on auth_sessions (expires_at);
create index if not exists auth_sessions_revoked_at_idx on auth_sessions (revoked_at);

-- Role/mosque mapping for RLS (maps authenticated auth.users to app roles)
create table if not exists profiles (
  auth_user_id uuid primary key,
  app_user_id text unique,
  role text not null check (role in ('admin', 'shura', 'mosque_admin', 'member')),
  mosque_id text references mosques(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_mosque_id_idx on profiles (mosque_id);
create index if not exists profiles_role_idx on profiles (role);

-- Helper functions for RLS checks
create or replace function current_user_role()
returns text
language sql
stable
as $$
  select p.role
  from profiles p
  where p.auth_user_id = auth.uid()
$$;

create or replace function current_user_mosque_id()
returns text
language sql
stable
as $$
  select p.mosque_id
  from profiles p
  where p.auth_user_id = auth.uid()
$$;

create or replace function current_app_user_id()
returns text
language sql
stable
as $$
  select p.app_user_id
  from profiles p
  where p.auth_user_id = auth.uid()
$$;

create or replace function is_global_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.mosque_id is null
  )
$$;

create or replace function can_access_mosque(target_mosque_id text)
returns boolean
language sql
stable
as $$
  select is_global_admin() or (
    target_mosque_id is not null
    and current_user_mosque_id() is not null
    and current_user_mosque_id() = target_mosque_id
  )
$$;

-- Enable and force RLS on user-generated domain tables
alter table mosques enable row level security;
alter table events enable row level security;
alter table announcements enable row level security;
alter table finance_records enable row level security;
alter table users enable row level security;
alter table profiles enable row level security;
alter table auth_identities enable row level security;
alter table shura_members enable row level security;
alter table shura_visits enable row level security;
alter table shura_meetings enable row level security;
alter table shura_registrations enable row level security;
alter table shura_assessments enable row level security;
alter table shura_imam_appointments enable row level security;
alter table auth_sessions enable row level security;

alter table mosques force row level security;
alter table events force row level security;
alter table announcements force row level security;
alter table finance_records force row level security;
alter table users force row level security;
alter table profiles force row level security;
alter table auth_identities force row level security;
alter table shura_members force row level security;
alter table shura_visits force row level security;
alter table shura_meetings force row level security;
alter table shura_registrations force row level security;
alter table shura_assessments force row level security;
alter table shura_imam_appointments force row level security;
alter table auth_sessions force row level security;

-- Events policies (separate operation + role)
create policy events_select_admin on events for select to authenticated using (can_access_mosque("mosqueId"));
create policy events_insert_admin on events for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy events_update_admin on events for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy events_delete_admin on events for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');

create policy events_select_shura on events for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy events_insert_shura on events for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy events_update_shura on events for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura') with check (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy events_delete_shura on events for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura');

create policy events_select_mosque_admin on events for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy events_insert_mosque_admin on events for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy events_update_mosque_admin on events for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy events_delete_mosque_admin on events for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');

create policy events_select_member on events for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'member');
create policy events_insert_member on events for insert to authenticated with check (false);
create policy events_update_member on events for update to authenticated using (false) with check (false);
create policy events_delete_member on events for delete to authenticated using (false);

-- Announcements policies
create policy announcements_select_admin on announcements for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy announcements_insert_admin on announcements for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy announcements_update_admin on announcements for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy announcements_delete_admin on announcements for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');

create policy announcements_select_shura on announcements for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy announcements_insert_shura on announcements for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy announcements_update_shura on announcements for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura') with check (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy announcements_delete_shura on announcements for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura');

create policy announcements_select_mosque_admin on announcements for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy announcements_insert_mosque_admin on announcements for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy announcements_update_mosque_admin on announcements for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy announcements_delete_mosque_admin on announcements for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');

create policy announcements_select_member on announcements for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'member');
create policy announcements_insert_member on announcements for insert to authenticated with check (false);
create policy announcements_update_member on announcements for update to authenticated using (false) with check (false);
create policy announcements_delete_member on announcements for delete to authenticated using (false);

-- Finance policies
create policy finance_records_select_admin on finance_records for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy finance_records_insert_admin on finance_records for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy finance_records_update_admin on finance_records for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy finance_records_delete_admin on finance_records for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');

create policy finance_records_select_shura on finance_records for select to authenticated using (false);
create policy finance_records_insert_shura on finance_records for insert to authenticated with check (false);
create policy finance_records_update_shura on finance_records for update to authenticated using (false) with check (false);
create policy finance_records_delete_shura on finance_records for delete to authenticated using (false);

create policy finance_records_select_mosque_admin on finance_records for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy finance_records_insert_mosque_admin on finance_records for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy finance_records_update_mosque_admin on finance_records for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy finance_records_delete_mosque_admin on finance_records for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');

create policy finance_records_select_member on finance_records for select to authenticated using (false);
create policy finance_records_insert_member on finance_records for insert to authenticated with check (false);
create policy finance_records_update_member on finance_records for update to authenticated using (false) with check (false);
create policy finance_records_delete_member on finance_records for delete to authenticated using (false);

-- Users policies
create policy users_select_admin on users for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy users_insert_admin on users for insert to authenticated with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy users_update_admin on users for update to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin') with check (can_access_mosque("mosqueId") and current_user_role() = 'admin');
create policy users_delete_admin on users for delete to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'admin');

create policy users_select_shura on users for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'shura');
create policy users_insert_shura on users for insert to authenticated with check (false);
create policy users_update_shura on users for update to authenticated using (false) with check (false);
create policy users_delete_shura on users for delete to authenticated using (false);

create policy users_select_mosque_admin on users for select to authenticated using (can_access_mosque("mosqueId") and current_user_role() = 'mosque_admin');
create policy users_insert_mosque_admin on users for insert to authenticated with check (false);
create policy users_update_mosque_admin on users for update to authenticated using (false) with check (false);
create policy users_delete_mosque_admin on users for delete to authenticated using (false);

create policy users_select_member on users for select to authenticated using (id = current_app_user_id() and current_user_role() = 'member');
create policy users_insert_member on users for insert to authenticated with check (false);
create policy users_update_member on users for update to authenticated using (id = current_app_user_id() and current_user_role() = 'member') with check (id = current_app_user_id() and current_user_role() = 'member');
create policy users_delete_member on users for delete to authenticated using (false);

-- Mosques policies
create policy mosques_select_admin on mosques for select to authenticated using (can_access_mosque(id) and current_user_role() = 'admin');
create policy mosques_insert_admin on mosques for insert to authenticated with check (is_global_admin() and current_user_role() = 'admin');
create policy mosques_update_admin on mosques for update to authenticated using (can_access_mosque(id) and current_user_role() = 'admin') with check (can_access_mosque(id) and current_user_role() = 'admin');
create policy mosques_delete_admin on mosques for delete to authenticated using (is_global_admin() and current_user_role() = 'admin');

create policy mosques_select_shura on mosques for select to authenticated using (can_access_mosque(id) and current_user_role() = 'shura');
create policy mosques_insert_shura on mosques for insert to authenticated with check (false);
create policy mosques_update_shura on mosques for update to authenticated using (false) with check (false);
create policy mosques_delete_shura on mosques for delete to authenticated using (false);

create policy mosques_select_mosque_admin on mosques for select to authenticated using (can_access_mosque(id) and current_user_role() = 'mosque_admin');
create policy mosques_insert_mosque_admin on mosques for insert to authenticated with check (false);
create policy mosques_update_mosque_admin on mosques for update to authenticated using (false) with check (false);
create policy mosques_delete_mosque_admin on mosques for delete to authenticated using (false);

create policy mosques_select_member on mosques for select to authenticated using (can_access_mosque(id) and current_user_role() = 'member');
create policy mosques_insert_member on mosques for insert to authenticated with check (false);
create policy mosques_update_member on mosques for update to authenticated using (false) with check (false);
create policy mosques_delete_member on mosques for delete to authenticated using (false);

-- Auth/session/profile hardening policies
create policy profiles_select_admin on profiles for select to authenticated using (is_global_admin() and current_user_role() = 'admin');
create policy profiles_insert_admin on profiles for insert to authenticated with check (is_global_admin() and current_user_role() = 'admin');
create policy profiles_update_admin on profiles for update to authenticated using (is_global_admin() and current_user_role() = 'admin') with check (is_global_admin() and current_user_role() = 'admin');
create policy profiles_delete_admin on profiles for delete to authenticated using (is_global_admin() and current_user_role() = 'admin');

create policy profiles_select_shura on profiles for select to authenticated using (false);
create policy profiles_insert_shura on profiles for insert to authenticated with check (false);
create policy profiles_update_shura on profiles for update to authenticated using (false) with check (false);
create policy profiles_delete_shura on profiles for delete to authenticated using (false);

create policy profiles_select_mosque_admin on profiles for select to authenticated using (false);
create policy profiles_insert_mosque_admin on profiles for insert to authenticated with check (false);
create policy profiles_update_mosque_admin on profiles for update to authenticated using (false) with check (false);
create policy profiles_delete_mosque_admin on profiles for delete to authenticated using (false);

create policy profiles_select_member on profiles for select to authenticated using (auth_user_id = auth.uid() and current_user_role() = 'member');
create policy profiles_insert_member on profiles for insert to authenticated with check (false);
create policy profiles_update_member on profiles for update to authenticated using (false) with check (false);
create policy profiles_delete_member on profiles for delete to authenticated using (false);

create policy auth_identities_select_admin on auth_identities for select to authenticated using (is_global_admin() and current_user_role() = 'admin');
create policy auth_identities_insert_admin on auth_identities for insert to authenticated with check (is_global_admin() and current_user_role() = 'admin');
create policy auth_identities_update_admin on auth_identities for update to authenticated using (is_global_admin() and current_user_role() = 'admin') with check (is_global_admin() and current_user_role() = 'admin');
create policy auth_identities_delete_admin on auth_identities for delete to authenticated using (is_global_admin() and current_user_role() = 'admin');

create policy auth_identities_select_shura on auth_identities for select to authenticated using (false);
create policy auth_identities_insert_shura on auth_identities for insert to authenticated with check (false);
create policy auth_identities_update_shura on auth_identities for update to authenticated using (false) with check (false);
create policy auth_identities_delete_shura on auth_identities for delete to authenticated using (false);

create policy auth_identities_select_mosque_admin on auth_identities for select to authenticated using (false);
create policy auth_identities_insert_mosque_admin on auth_identities for insert to authenticated with check (false);
create policy auth_identities_update_mosque_admin on auth_identities for update to authenticated using (false) with check (false);
create policy auth_identities_delete_mosque_admin on auth_identities for delete to authenticated using (false);

create policy auth_identities_select_member on auth_identities for select to authenticated using (false);
create policy auth_identities_insert_member on auth_identities for insert to authenticated with check (false);
create policy auth_identities_update_member on auth_identities for update to authenticated using (false) with check (false);
create policy auth_identities_delete_member on auth_identities for delete to authenticated using (false);

create policy auth_sessions_select_admin on auth_sessions for select to authenticated using (is_global_admin() and current_user_role() = 'admin');
create policy auth_sessions_insert_admin on auth_sessions for insert to authenticated with check (is_global_admin() and current_user_role() = 'admin');
create policy auth_sessions_update_admin on auth_sessions for update to authenticated using (is_global_admin() and current_user_role() = 'admin') with check (is_global_admin() and current_user_role() = 'admin');
create policy auth_sessions_delete_admin on auth_sessions for delete to authenticated using (is_global_admin() and current_user_role() = 'admin');

create policy auth_sessions_select_shura on auth_sessions for select to authenticated using (false);
create policy auth_sessions_insert_shura on auth_sessions for insert to authenticated with check (false);
create policy auth_sessions_update_shura on auth_sessions for update to authenticated using (false) with check (false);
create policy auth_sessions_delete_shura on auth_sessions for delete to authenticated using (false);

create policy auth_sessions_select_mosque_admin on auth_sessions for select to authenticated using (false);
create policy auth_sessions_insert_mosque_admin on auth_sessions for insert to authenticated with check (false);
create policy auth_sessions_update_mosque_admin on auth_sessions for update to authenticated using (false) with check (false);
create policy auth_sessions_delete_mosque_admin on auth_sessions for delete to authenticated using (false);

create policy auth_sessions_select_member on auth_sessions for select to authenticated using (false);
create policy auth_sessions_insert_member on auth_sessions for insert to authenticated with check (false);
create policy auth_sessions_update_member on auth_sessions for update to authenticated using (false) with check (false);
create policy auth_sessions_delete_member on auth_sessions for delete to authenticated using (false);

-- Shura workflow tables
create policy shura_members_select_admin on shura_members for select to authenticated using (current_user_role() = 'admin');
create policy shura_members_insert_admin on shura_members for insert to authenticated with check (current_user_role() = 'admin');
create policy shura_members_update_admin on shura_members for update to authenticated using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy shura_members_delete_admin on shura_members for delete to authenticated using (current_user_role() = 'admin');
create policy shura_members_select_shura on shura_members for select to authenticated using (current_user_role() = 'shura');
create policy shura_members_insert_shura on shura_members for insert to authenticated with check (current_user_role() = 'shura');
create policy shura_members_update_shura on shura_members for update to authenticated using (current_user_role() = 'shura') with check (current_user_role() = 'shura');
create policy shura_members_delete_shura on shura_members for delete to authenticated using (current_user_role() = 'shura');
create policy shura_members_select_mosque_admin on shura_members for select to authenticated using (false);
create policy shura_members_insert_mosque_admin on shura_members for insert to authenticated with check (false);
create policy shura_members_update_mosque_admin on shura_members for update to authenticated using (false) with check (false);
create policy shura_members_delete_mosque_admin on shura_members for delete to authenticated using (false);
create policy shura_members_select_member on shura_members for select to authenticated using (false);
create policy shura_members_insert_member on shura_members for insert to authenticated with check (false);
create policy shura_members_update_member on shura_members for update to authenticated using (false) with check (false);
create policy shura_members_delete_member on shura_members for delete to authenticated using (false);

create policy shura_visits_select_admin on shura_visits for select to authenticated using (current_user_role() = 'admin');
create policy shura_visits_insert_admin on shura_visits for insert to authenticated with check (current_user_role() = 'admin');
create policy shura_visits_update_admin on shura_visits for update to authenticated using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy shura_visits_delete_admin on shura_visits for delete to authenticated using (current_user_role() = 'admin');
create policy shura_visits_select_shura on shura_visits for select to authenticated using (current_user_role() = 'shura');
create policy shura_visits_insert_shura on shura_visits for insert to authenticated with check (current_user_role() = 'shura');
create policy shura_visits_update_shura on shura_visits for update to authenticated using (current_user_role() = 'shura') with check (current_user_role() = 'shura');
create policy shura_visits_delete_shura on shura_visits for delete to authenticated using (current_user_role() = 'shura');
create policy shura_visits_select_mosque_admin on shura_visits for select to authenticated using (false);
create policy shura_visits_insert_mosque_admin on shura_visits for insert to authenticated with check (false);
create policy shura_visits_update_mosque_admin on shura_visits for update to authenticated using (false) with check (false);
create policy shura_visits_delete_mosque_admin on shura_visits for delete to authenticated using (false);
create policy shura_visits_select_member on shura_visits for select to authenticated using (false);
create policy shura_visits_insert_member on shura_visits for insert to authenticated with check (false);
create policy shura_visits_update_member on shura_visits for update to authenticated using (false) with check (false);
create policy shura_visits_delete_member on shura_visits for delete to authenticated using (false);

create policy shura_meetings_select_admin on shura_meetings for select to authenticated using (current_user_role() = 'admin');
create policy shura_meetings_insert_admin on shura_meetings for insert to authenticated with check (current_user_role() = 'admin');
create policy shura_meetings_update_admin on shura_meetings for update to authenticated using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy shura_meetings_delete_admin on shura_meetings for delete to authenticated using (current_user_role() = 'admin');
create policy shura_meetings_select_shura on shura_meetings for select to authenticated using (current_user_role() = 'shura');
create policy shura_meetings_insert_shura on shura_meetings for insert to authenticated with check (current_user_role() = 'shura');
create policy shura_meetings_update_shura on shura_meetings for update to authenticated using (current_user_role() = 'shura') with check (current_user_role() = 'shura');
create policy shura_meetings_delete_shura on shura_meetings for delete to authenticated using (current_user_role() = 'shura');
create policy shura_meetings_select_mosque_admin on shura_meetings for select to authenticated using (false);
create policy shura_meetings_insert_mosque_admin on shura_meetings for insert to authenticated with check (false);
create policy shura_meetings_update_mosque_admin on shura_meetings for update to authenticated using (false) with check (false);
create policy shura_meetings_delete_mosque_admin on shura_meetings for delete to authenticated using (false);
create policy shura_meetings_select_member on shura_meetings for select to authenticated using (false);
create policy shura_meetings_insert_member on shura_meetings for insert to authenticated with check (false);
create policy shura_meetings_update_member on shura_meetings for update to authenticated using (false) with check (false);
create policy shura_meetings_delete_member on shura_meetings for delete to authenticated using (false);

create policy shura_registrations_select_admin on shura_registrations for select to authenticated using (current_user_role() = 'admin');
create policy shura_registrations_insert_admin on shura_registrations for insert to authenticated with check (current_user_role() = 'admin');
create policy shura_registrations_update_admin on shura_registrations for update to authenticated using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy shura_registrations_delete_admin on shura_registrations for delete to authenticated using (current_user_role() = 'admin');
create policy shura_registrations_select_shura on shura_registrations for select to authenticated using (current_user_role() = 'shura');
create policy shura_registrations_insert_shura on shura_registrations for insert to authenticated with check (current_user_role() = 'shura');
create policy shura_registrations_update_shura on shura_registrations for update to authenticated using (current_user_role() = 'shura') with check (current_user_role() = 'shura');
create policy shura_registrations_delete_shura on shura_registrations for delete to authenticated using (current_user_role() = 'shura');
create policy shura_registrations_select_mosque_admin on shura_registrations for select to authenticated using (false);
create policy shura_registrations_insert_mosque_admin on shura_registrations for insert to authenticated with check (false);
create policy shura_registrations_update_mosque_admin on shura_registrations for update to authenticated using (false) with check (false);
create policy shura_registrations_delete_mosque_admin on shura_registrations for delete to authenticated using (false);
create policy shura_registrations_select_member on shura_registrations for select to authenticated using (false);
create policy shura_registrations_insert_member on shura_registrations for insert to authenticated with check (false);
create policy shura_registrations_update_member on shura_registrations for update to authenticated using (false) with check (false);
create policy shura_registrations_delete_member on shura_registrations for delete to authenticated using (false);

create policy shura_assessments_select_admin on shura_assessments for select to authenticated using (current_user_role() = 'admin');
create policy shura_assessments_insert_admin on shura_assessments for insert to authenticated with check (current_user_role() = 'admin');
create policy shura_assessments_update_admin on shura_assessments for update to authenticated using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy shura_assessments_delete_admin on shura_assessments for delete to authenticated using (current_user_role() = 'admin');
create policy shura_assessments_select_shura on shura_assessments for select to authenticated using (current_user_role() = 'shura');
create policy shura_assessments_insert_shura on shura_assessments for insert to authenticated with check (current_user_role() = 'shura');
create policy shura_assessments_update_shura on shura_assessments for update to authenticated using (current_user_role() = 'shura') with check (current_user_role() = 'shura');
create policy shura_assessments_delete_shura on shura_assessments for delete to authenticated using (current_user_role() = 'shura');
create policy shura_assessments_select_mosque_admin on shura_assessments for select to authenticated using (false);
create policy shura_assessments_insert_mosque_admin on shura_assessments for insert to authenticated with check (false);
create policy shura_assessments_update_mosque_admin on shura_assessments for update to authenticated using (false) with check (false);
create policy shura_assessments_delete_mosque_admin on shura_assessments for delete to authenticated using (false);
create policy shura_assessments_select_member on shura_assessments for select to authenticated using (false);
create policy shura_assessments_insert_member on shura_assessments for insert to authenticated with check (false);
create policy shura_assessments_update_member on shura_assessments for update to authenticated using (false) with check (false);
create policy shura_assessments_delete_member on shura_assessments for delete to authenticated using (false);

create policy shura_imam_appointments_select_admin on shura_imam_appointments for select to authenticated using (current_user_role() = 'admin');
create policy shura_imam_appointments_insert_admin on shura_imam_appointments for insert to authenticated with check (current_user_role() = 'admin');
create policy shura_imam_appointments_update_admin on shura_imam_appointments for update to authenticated using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy shura_imam_appointments_delete_admin on shura_imam_appointments for delete to authenticated using (current_user_role() = 'admin');
create policy shura_imam_appointments_select_shura on shura_imam_appointments for select to authenticated using (current_user_role() = 'shura');
create policy shura_imam_appointments_insert_shura on shura_imam_appointments for insert to authenticated with check (current_user_role() = 'shura');
create policy shura_imam_appointments_update_shura on shura_imam_appointments for update to authenticated using (current_user_role() = 'shura') with check (current_user_role() = 'shura');
create policy shura_imam_appointments_delete_shura on shura_imam_appointments for delete to authenticated using (current_user_role() = 'shura');
create policy shura_imam_appointments_select_mosque_admin on shura_imam_appointments for select to authenticated using (false);
create policy shura_imam_appointments_insert_mosque_admin on shura_imam_appointments for insert to authenticated with check (false);
create policy shura_imam_appointments_update_mosque_admin on shura_imam_appointments for update to authenticated using (false) with check (false);
create policy shura_imam_appointments_delete_mosque_admin on shura_imam_appointments for delete to authenticated using (false);
create policy shura_imam_appointments_select_member on shura_imam_appointments for select to authenticated using (false);
create policy shura_imam_appointments_insert_member on shura_imam_appointments for insert to authenticated with check (false);
create policy shura_imam_appointments_update_member on shura_imam_appointments for update to authenticated using (false) with check (false);
create policy shura_imam_appointments_delete_member on shura_imam_appointments for delete to authenticated using (false);

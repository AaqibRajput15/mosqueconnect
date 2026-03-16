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
  "avatarUrl" text,
  phone text,
  "emailVerified" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists shura_members (id text primary key, payload jsonb not null);
create table if not exists shura_visits (id text primary key, payload jsonb not null);
create table if not exists shura_meetings (id text primary key, payload jsonb not null);
create table if not exists shura_registrations (id text primary key, payload jsonb not null);
create table if not exists shura_assessments (id text primary key, payload jsonb not null);
create table if not exists shura_imam_appointments (id text primary key, payload jsonb not null);


create table if not exists auth_one_time_tokens (
  id text primary key,
  "userId" text not null,
  purpose text not null,
  "tokenHash" text not null,
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);

create index if not exists auth_one_time_tokens_lookup_idx on auth_one_time_tokens (purpose, "tokenHash");

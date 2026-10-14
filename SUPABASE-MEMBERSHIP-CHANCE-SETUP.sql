-- KRYVEN ERA — "Chance to Membership" offer
-- Run once in Supabase Dashboard -> SQL Editor (after SUPABASE-ERA-REWARDS-SETUP.sql).
create extension if not exists pgcrypto;

-- Secret codes you hand out personally. Kept server-side only (never in public store settings).
create table if not exists public.kryven_membership_codes (
  code text primary key,
  note text,
  enabled boolean not null default true,
  max_uses int not null default 1,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

-- Every customer who enters a valid code lands here so you can grant the membership.
create table if not exists public.kryven_membership_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  code text not null,
  status text not null default 'pending' check (status in ('pending','granted','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists kryven_membership_requests_status_idx on public.kryven_membership_requests(status, created_at desc);

alter table public.kryven_membership_codes enable row level security;
alter table public.kryven_membership_requests enable row level security;
revoke all on public.kryven_membership_codes from anon, authenticated;
revoke all on public.kryven_membership_requests from anon, authenticated;
grant all on public.kryven_membership_codes to service_role;
grant all on public.kryven_membership_requests to service_role;

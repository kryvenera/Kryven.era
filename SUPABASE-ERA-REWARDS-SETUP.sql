-- KRYVEN ERA membership + one-use reward setup
-- Run once in Supabase Dashboard -> SQL Editor for the project already used by this site.
-- Keep the service-role key ONLY in Vercel Environment Variables.

create extension if not exists pgcrypto;

create table if not exists public.kryven_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('paid','wheel','admin')),
  order_id text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists kryven_memberships_user_active_idx on public.kryven_memberships(user_id, expires_at desc);

create table if not exists public.kryven_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_key text not null,
  reward_type text not null check (reward_type in ('discount','membership')),
  discount_percent numeric(5,2),
  product_ids text[] not null default '{}',
  coupon_code text unique,
  status text not null default 'available' check (status in ('available','pending','redeemed','expired')),
  order_id text,
  expires_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id, campaign_key)
);
create index if not exists kryven_reward_claims_user_idx on public.kryven_reward_claims(user_id, created_at desc);

create table if not exists public.kryven_coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coupon_code text not null,
  order_id text not null,
  status text not null default 'pending' check (status in ('pending','redeemed','released')),
  reserved_until timestamptz not null default (now() + interval '30 minutes'),
  discount_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique(user_id, coupon_code)
);
create index if not exists kryven_coupon_redemptions_code_idx on public.kryven_coupon_redemptions(coupon_code, status);

-- Only trusted server functions using the service-role key should access these tables.
alter table public.kryven_memberships enable row level security;
alter table public.kryven_reward_claims add column if not exists reserved_until timestamptz;

alter table public.kryven_reward_claims enable row level security;
alter table public.kryven_coupon_redemptions enable row level security;
revoke all on public.kryven_memberships from anon, authenticated;
revoke all on public.kryven_reward_claims from anon, authenticated;
revoke all on public.kryven_coupon_redemptions from anon, authenticated;
grant all on public.kryven_memberships to service_role;
grant all on public.kryven_reward_claims to service_role;
grant all on public.kryven_coupon_redemptions to service_role;

-- Atomic one-time creator-code reservation with an optional campaign-wide usage cap.
-- Drop the earlier 4-argument version if this script was run during a previous setup attempt.
drop function if exists public.reserve_kryven_coupon(uuid,text,text,numeric);
create or replace function public.reserve_kryven_coupon(
  p_user_id uuid, p_coupon_code text, p_order_id text, p_discount_amount numeric, p_max_uses integer default 0
) returns boolean
language plpgsql security definer set search_path=public as $$
declare saved_id uuid; existing_id uuid; existing_status text; existing_order_id text; existing_until timestamptz; used_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(upper(p_coupon_code)));
  select id,status,order_id,reserved_until into existing_id,existing_status,existing_order_id,existing_until
    from public.kryven_coupon_redemptions where user_id=p_user_id and coupon_code=upper(p_coupon_code) for update;
  if existing_id is not null then
    if existing_status='redeemed' then return false; end if;
    if existing_status='pending' and existing_until>now() then
      if existing_order_id=p_order_id then return true; else return false; end if;
    end if;
  end if;
  if coalesce(p_max_uses,0)>0 then
    select count(*) into used_count from public.kryven_coupon_redemptions
      where coupon_code=upper(p_coupon_code)
        and (status='redeemed' or (status='pending' and reserved_until>now()))
        and (existing_id is null or id<>existing_id);
    if used_count>=p_max_uses then return false; end if;
  end if;
  if existing_id is null then
    insert into public.kryven_coupon_redemptions(user_id,coupon_code,order_id,status,reserved_until,discount_amount)
      values(p_user_id,upper(p_coupon_code),p_order_id,'pending',now()+interval '30 minutes',greatest(0,p_discount_amount))
      returning id into saved_id;
  else
    update public.kryven_coupon_redemptions set order_id=p_order_id,status='pending',reserved_until=now()+interval '30 minutes',
      discount_amount=greatest(0,p_discount_amount),created_at=now(),redeemed_at=null where id=existing_id returning id into saved_id;
  end if;
  return saved_id is not null;
end $$;
revoke all on function public.reserve_kryven_coupon(uuid,text,text,numeric,integer) from public, anon, authenticated;
grant execute on function public.reserve_kryven_coupon(uuid,text,text,numeric,integer) to service_role;

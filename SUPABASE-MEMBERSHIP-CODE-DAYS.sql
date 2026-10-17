-- Run ONCE in Supabase → SQL Editor.
-- Lets every membership code carry its own duration (in days).
alter table public.kryven_membership_codes
  add column if not exists days integer not null default 30;

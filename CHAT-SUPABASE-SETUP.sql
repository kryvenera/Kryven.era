-- KRYVEN ERA website chat. Run in Supabase SQL Editor for the same project as the store.
create extension if not exists pgcrypto;
create table if not exists public.kryven_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null,
  customer_name text not null default 'Website visitor',
  status text not null default 'open' check (status in ('open','closed')),
  last_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kryven_chat_conversations_updated_idx on public.kryven_chat_conversations (updated_at desc);
create table if not exists public.kryven_chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.kryven_chat_conversations(id) on delete cascade,
  sender text not null check (sender in ('customer','support','system')),
  body text not null check (char_length(body) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index if not exists kryven_chat_messages_conversation_idx on public.kryven_chat_messages (conversation_id, id);
alter table public.kryven_chat_conversations enable row level security;
alter table public.kryven_chat_messages enable row level security;
-- All access goes through /api/chat using the server-only service-role key. No direct browser table access.
revoke all on public.kryven_chat_conversations from anon, authenticated;
revoke all on public.kryven_chat_messages from anon, authenticated;

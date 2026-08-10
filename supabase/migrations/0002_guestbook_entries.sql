create extension if not exists pgcrypto;

create type public.moderation_status as enum ('pending', 'approved', 'rejected');

create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  message text not null,
  reaction text,
  status public.moderation_status not null default 'pending',
  client_id text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint guestbook_nickname_length check (char_length(btrim(nickname)) between 1 and 30),
  constraint guestbook_message_length check (char_length(btrim(message)) between 1 and 200),
  constraint guestbook_reaction_length check (reaction is null or char_length(reaction) <= 16),
  constraint guestbook_client_id_present check (char_length(btrim(client_id)) between 1 and 128)
);

create index guestbook_public_feed_idx on public.guestbook_entries (created_at desc, id desc)
  where status = 'approved' and deleted_at is null;

alter table public.guestbook_entries enable row level security;

create policy "anon can submit pending guestbook entries" on public.guestbook_entries
  for insert to anon with check (status = 'pending');

create policy "anon can read approved guestbook entries" on public.guestbook_entries
  for select to anon using (status = 'approved' and deleted_at is null);

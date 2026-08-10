create extension if not exists pgcrypto;

create type public.request_status as enum ('pending', 'approved', 'played', 'rejected');

create table public.song_requests (
  id uuid primary key default gen_random_uuid(),
  spotify_url text,
  youtube_url text,
  nickname text,
  dedication text,
  status public.request_status not null default 'pending',
  client_id text not null,
  created_at timestamptz not null default now(),
  constraint song_requests_url_required check (nullif(btrim(spotify_url), '') is not null or nullif(btrim(youtube_url), '') is not null),
  constraint song_requests_nickname_length check (nickname is null or char_length(nickname) <= 40),
  constraint song_requests_dedication_length check (dedication is null or char_length(dedication) <= 200),
  constraint song_requests_client_id_present check (char_length(btrim(client_id)) between 1 and 128)
);

create index song_requests_status_created_id_idx on public.song_requests (status, created_at desc, id desc);

alter table public.song_requests enable row level security;

create policy "anon can submit pending song requests" on public.song_requests
  for insert to anon with check (status = 'pending');

create policy "anon can read public song requests" on public.song_requests
  for select to anon using (status in ('approved', 'played'));

-- Exprésate Premium device registry.
-- Run this once in the Supabase SQL editor before enabling production enforcement.

create extension if not exists pgcrypto;

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 16 and 128),
  device_name text not null default 'Unknown device',
  user_agent text not null default '',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  is_active boolean not null default true,
  constraint user_devices_user_device_unique unique (user_id, device_id)
);

create index if not exists user_devices_active_lookup
  on public.user_devices (user_id, is_active, first_seen, id);

alter table public.user_devices enable row level security;

drop policy if exists "Users can read their devices" on public.user_devices;
create policy "Users can read their devices"
  on public.user_devices for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can register their devices" on public.user_devices;
create policy "Users can register their devices"
  on public.user_devices for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their devices" on public.user_devices;
create policy "Users can update their devices"
  on public.user_devices for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.user_devices to authenticated;

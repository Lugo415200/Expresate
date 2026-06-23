-- Stripe billing columns for Exprésate Premium.
-- Run this in the Supabase SQL Editor before deploying the Stripe Edge Functions.
-- Existing premium gating already reads subscription_status and current_period_end.

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists plan text default 'free';

create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id);

create index if not exists profiles_subscription_status_idx
  on public.profiles (subscription_status);

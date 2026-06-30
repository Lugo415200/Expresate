-- Exprésate Studio cloud publishing (Phase 7).
-- Run this file in the Supabase SQL Editor, then verify the final admin seed.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_unique
  on public.admin_users (lower(email));

create table if not exists public.studio_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  module text not null default 'Unassigned',
  level text not null default 'A1' check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  premium boolean not null default false,
  xp_reward integer not null default 10 check (xp_reward between 0 and 1000),
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  tags text[] not null default '{}',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.studio_lessons(id) on delete cascade,
  block_order integer not null check (block_order >= 0),
  block_type text not null check (block_type in ('explanation', 'vocabulary', 'image', 'quiz', 'speech', 'completion')),
  block_data jsonb not null default '{}'::jsonb check (jsonb_typeof(block_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_lesson_blocks_order_unique unique (lesson_id, block_order)
);

create index if not exists studio_lessons_public_lookup
  on public.studio_lessons (status, updated_at desc);

create index if not exists studio_lesson_blocks_lesson_order
  on public.studio_lesson_blocks (lesson_id, block_order);

create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_studio_admin() from public;
grant execute on function public.is_studio_admin() to authenticated;

create or replace function public.touch_studio_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists studio_lessons_touch_updated_at on public.studio_lessons;
create trigger studio_lessons_touch_updated_at
before update on public.studio_lessons
for each row execute function public.touch_studio_updated_at();

drop trigger if exists studio_lesson_blocks_touch_updated_at on public.studio_lesson_blocks;
create trigger studio_lesson_blocks_touch_updated_at
before update on public.studio_lesson_blocks
for each row execute function public.touch_studio_updated_at();

alter table public.admin_users enable row level security;
alter table public.studio_lessons enable row level security;
alter table public.studio_lesson_blocks enable row level security;

drop policy if exists "Admins can read their admin record" on public.admin_users;
create policy "Admins can read their admin record"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Published lessons are public" on public.studio_lessons;
create policy "Published lessons are public"
  on public.studio_lessons for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can read all lessons" on public.studio_lessons;
create policy "Admins can read all lessons"
  on public.studio_lessons for select
  to authenticated
  using (public.is_studio_admin());

drop policy if exists "Admins can create lessons" on public.studio_lessons;
create policy "Admins can create lessons"
  on public.studio_lessons for insert
  to authenticated
  with check (public.is_studio_admin() and created_by = auth.uid());

drop policy if exists "Admins can update lessons" on public.studio_lessons;
create policy "Admins can update lessons"
  on public.studio_lessons for update
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

drop policy if exists "Admins can delete lessons" on public.studio_lessons;
create policy "Admins can delete lessons"
  on public.studio_lessons for delete
  to authenticated
  using (public.is_studio_admin());

drop policy if exists "Published lesson blocks are public" on public.studio_lesson_blocks;
create policy "Published lesson blocks are public"
  on public.studio_lesson_blocks for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.studio_lessons
      where studio_lessons.id = studio_lesson_blocks.lesson_id
        and studio_lessons.status = 'published'
    )
  );

drop policy if exists "Admins can read all lesson blocks" on public.studio_lesson_blocks;
create policy "Admins can read all lesson blocks"
  on public.studio_lesson_blocks for select
  to authenticated
  using (public.is_studio_admin());

drop policy if exists "Admins can create lesson blocks" on public.studio_lesson_blocks;
create policy "Admins can create lesson blocks"
  on public.studio_lesson_blocks for insert
  to authenticated
  with check (public.is_studio_admin());

drop policy if exists "Admins can update lesson blocks" on public.studio_lesson_blocks;
create policy "Admins can update lesson blocks"
  on public.studio_lesson_blocks for update
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

drop policy if exists "Admins can delete lesson blocks" on public.studio_lesson_blocks;
create policy "Admins can delete lesson blocks"
  on public.studio_lesson_blocks for delete
  to authenticated
  using (public.is_studio_admin());

grant select on public.studio_lessons, public.studio_lesson_blocks to anon, authenticated;
grant insert, update, delete on public.studio_lessons, public.studio_lesson_blocks to authenticated;
grant select on public.admin_users to authenticated;

-- Atomically upsert one lesson and replace its ordered blocks. The function
-- uses the caller's permissions; RLS remains the authorization boundary.
create or replace function public.publish_studio_lesson(
  p_lesson jsonb,
  p_blocks jsonb
)
returns public.studio_lessons
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.studio_lessons;
  item jsonb;
begin
  if not public.is_studio_admin() then
    raise exception 'Studio admin access required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Lesson blocks must be an array' using errcode = '22023';
  end if;

  insert into public.studio_lessons (
    slug, title, module, level, premium, xp_reward, description, status, tags, created_by
  ) values (
    p_lesson->>'slug',
    p_lesson->>'title',
    coalesce(nullif(p_lesson->>'module', ''), 'Unassigned'),
    coalesce(nullif(p_lesson->>'level', ''), 'A1'),
    coalesce((p_lesson->>'premium')::boolean, false),
    coalesce((p_lesson->>'xp_reward')::integer, 10),
    coalesce(p_lesson->>'description', ''),
    coalesce(nullif(p_lesson->>'status', ''), 'published'),
    coalesce(array(select jsonb_array_elements_text(p_lesson->'tags')), '{}'),
    auth.uid()
  )
  on conflict (slug) do update set
    title = excluded.title,
    module = excluded.module,
    level = excluded.level,
    premium = excluded.premium,
    xp_reward = excluded.xp_reward,
    description = excluded.description,
    status = excluded.status,
    tags = excluded.tags
  returning * into saved;

  delete from public.studio_lesson_blocks where lesson_id = saved.id;

  for item in select value from jsonb_array_elements(p_blocks)
  loop
    insert into public.studio_lesson_blocks (lesson_id, block_order, block_type, block_data)
    values (
      saved.id,
      (item->>'block_order')::integer,
      item->>'block_type',
      coalesce(item->'block_data', '{}'::jsonb)
    );
  end loop;

  return saved;
end;
$$;

grant execute on function public.publish_studio_lesson(jsonb, jsonb) to authenticated;

-- Seed the current Studio administrator after the account exists in auth.users.
insert into public.admin_users (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = 'ynoellugo@icloud.com'
on conflict (user_id) do update set email = excluded.email;

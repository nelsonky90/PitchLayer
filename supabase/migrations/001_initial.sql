-- Run this in your Supabase SQL editor to initialise the schema

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text,
  mfa_secret    text,
  locked_until  timestamptz,
  failed_attempts integer default 0
);

create table if not exists public.pitches (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  company      text not null,
  opportunity  text not null,
  personas     jsonb not null default '[]',
  pain_points  text not null,
  benefits     text not null,
  ai_output    jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- Index for fast per-user queries (excluding soft-deleted rows)
create index if not exists pitches_user_active
  on public.pitches(user_id)
  where deleted_at is null;

-- Automatically update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pitches_set_updated_at on public.pitches;
create trigger pitches_set_updated_at
  before update on public.pitches
  for each row execute function public.set_updated_at();

-- Row-level security (service role key bypasses these; they guard anon/user keys)
alter table public.users enable row level security;
alter table public.pitches enable row level security;

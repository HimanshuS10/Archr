-- =============================================================
--  Archr · user_events table
--  Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- =============================================================

-- 1. Enums
-- ---------------------------------------------------------
create type event_recurrence as enum ('none', 'daily', 'weekly', 'monthly', 'custom');
create type event_priority    as enum ('low', 'medium', 'high');


-- 2. Table
-- ---------------------------------------------------------
create table if not exists public.user_events (
  -- Identity
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  -- Google Calendar link (null for locally-created events)
  google_event_id   text,

  -- Core event fields (mirrors the modal form)
  title             text        not null,
  description       text,
  start_at          timestamptz not null,
  end_at            timestamptz not null,

  -- AI-context fields
  recurrence        event_recurrence not null default 'none',
  custom_recurrence text,                     -- only used when recurrence = 'custom'
  travel_mins       smallint     check (travel_mins >= 0 and travel_mins <= 300),
  is_fixed          boolean      not null default false,
  priority          event_priority not null default 'medium',

  -- Audit
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now()
);


-- 3. Indexes
-- ---------------------------------------------------------
-- Fast lookup of all events for a user sorted by date
create index on public.user_events (user_id, start_at);

-- Lookup by google_event_id (for sync / dedup)
create index on public.user_events (google_event_id) where google_event_id is not null;


-- 4. Auto-update updated_at on every row change
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_events_set_updated_at
  before update on public.user_events
  for each row execute function public.set_updated_at();


-- 5. Row Level Security
-- ---------------------------------------------------------
alter table public.user_events enable row level security;

-- Users can only see their own events
create policy "Users can view own events"
  on public.user_events for select
  using (auth.uid() = user_id);

-- Users can insert their own events
create policy "Users can insert own events"
  on public.user_events for insert
  with check (auth.uid() = user_id);

-- Users can update their own events
create policy "Users can update own events"
  on public.user_events for update
  using (auth.uid() = user_id);

-- Users can delete their own events
create policy "Users can delete own events"
  on public.user_events for delete
  using (auth.uid() = user_id);


-- =============================================================
--  Column reference
-- =============================================================
--
--  id                · UUID primary key (auto-generated)
--  user_id           · References auth.users; cascade-deletes with account
--  google_event_id   · Google Calendar event ID for two-way sync (nullable)
--  title             · Event name  
--  description       · User-written description (plain text, no archr block)
--  start_at          · Start datetime with timezone
--  end_at            · End datetime with timezone
--  recurrence        · none | daily | weekly | monthly | custom
--  custom_recurrence · Free-text rule (e.g. "Every other Tuesday")
--  travel_mins       · Required commute / travel buffer in minutes (0-300)
--  is_fixed          · true = AI cannot reschedule this event
--  priority          · low | medium | high
--  created_at        · Row creation timestamp
--  updated_at        · Auto-updated on every write
--
-- =============================================================

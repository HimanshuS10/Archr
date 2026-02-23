create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  google_event_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped', 'deleted')),
  algorithm_version text not null default 'v1_simple_gaps',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_sessions enable row level security;

drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own"
on public.study_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own"
on public.study_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_update_own" on public.study_sessions;
create policy "study_sessions_update_own"
on public.study_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own"
on public.study_sessions
for delete
using (auth.uid() = user_id);

create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id);
create index if not exists idx_study_sessions_task_id on public.study_sessions(task_id);
create index if not exists idx_study_sessions_start_time on public.study_sessions(start_time);
create index if not exists idx_study_sessions_status on public.study_sessions(status);

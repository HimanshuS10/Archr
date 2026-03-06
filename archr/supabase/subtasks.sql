  -- Create the subtasks table
  -- Run this in Supabase SQL Editor

  create table if not exists public.subtasks (
    id                uuid        primary key default gen_random_uuid(),
    task_id           uuid        not null references public.tasks(id) on delete cascade,
    user_id           uuid        not null references auth.users(id) on delete cascade,
    title             text        not null,
    estimated_minutes smallint,
    "order"           smallint    not null default 0,
    status            text        not null default 'todo' check (status in ('todo', 'done')),
    ai_generated      boolean     not null default false,
    created_at        timestamptz not null default now()
  );

  -- Index for fast per-task lookups
  create index if not exists subtasks_task_id_idx on public.subtasks (task_id, "order");

  -- RLS
  alter table public.subtasks enable row level security;

  create policy "Users can view own subtasks"
    on public.subtasks for select
    using (auth.uid() = user_id);

  create policy "Users can insert own subtasks"
    on public.subtasks for insert
    with check (auth.uid() = user_id);

  create policy "Users can update own subtasks"
    on public.subtasks for update
    using (auth.uid() = user_id);

  create policy "Users can delete own subtasks"
    on public.subtasks for delete
    using (auth.uid() = user_id);

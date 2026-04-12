-- Add type column to distinguish to-do items from deadline entries
-- Run this in Supabase SQL Editor

alter table public.tasks
  add column if not exists type text not null default 'deadline'
    check (type in ('todo', 'deadline'));

-- Existing rows are all deadline-type tasks
update public.tasks set type = 'deadline' where type is null;

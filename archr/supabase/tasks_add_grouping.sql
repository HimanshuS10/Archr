-- Add grouping/tag field for deadline filtering
-- Run this in Supabase SQL Editor

alter table public.tasks
  add column if not exists grouping text;

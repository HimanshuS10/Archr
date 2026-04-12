-- Add color for grouping/tag display
-- Run this in Supabase SQL Editor

alter table public.tasks
  add column if not exists grouping_color text;

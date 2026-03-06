-- Add assignment content columns to the existing tasks table
-- Run this in Supabase SQL Editor

alter table public.tasks
  add column if not exists assignment_text text,
  add column if not exists file_name       text;

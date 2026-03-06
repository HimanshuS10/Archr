alter table public.tasks
  add column if not exists file_url text;


insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', false)
on conflict (id) do nothing;


create policy "Users can upload task files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'task-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own task files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own task files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'task-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

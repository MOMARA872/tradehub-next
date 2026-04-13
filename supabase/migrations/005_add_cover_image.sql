-- Add cover/banner image to profiles.
alter table profiles add column cover_image text;

-- Storage bucket for profile cover images (public read).
insert into storage.buckets (id, name, public)
values ('profile-covers', 'profile-covers', true)
on conflict (id) do nothing;

create policy "Public read access for covers"
  on storage.objects for select
  using (bucket_id = 'profile-covers');

create policy "Users can upload own cover"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own cover"
  on storage.objects for update
  using (
    bucket_id = 'profile-covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own cover"
  on storage.objects for delete
  using (
    bucket_id = 'profile-covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

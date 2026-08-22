begin;

create table if not exists public.blugbug_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blugbug_posts(id) on delete cascade,
  user_id text not null references public.blugbug_users(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  caption text not null default '' check (char_length(caption) <= 500),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  byte_size bigint not null check (byte_size between 1 and 5242880),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blugbug_post_media_post_idx
  on public.blugbug_post_media(post_id, created_at);
create index if not exists blugbug_post_media_user_idx
  on public.blugbug_post_media(user_id, created_at);

alter table public.blugbug_post_media enable row level security;

drop trigger if exists blugbug_post_media_updated_at on public.blugbug_post_media;
create trigger blugbug_post_media_updated_at
before update on public.blugbug_post_media
for each row execute function blugbug_private.touch_updated_at();

create policy "blugbug_post_media_read" on public.blugbug_post_media
for select using (
  exists (
    select 1 from public.blugbug_posts p
    where p.id = post_id
      and (p.status = 'published' or p.user_id = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()))
  )
);
create policy "blugbug_post_media_insert" on public.blugbug_post_media
for insert with check (
  (user_id = (select blugbug_private.current_profile_id())
  and exists (select 1 from public.blugbug_posts p where p.id = post_id and p.user_id = user_id))
  or (select blugbug_private.is_admin())
);
create policy "blugbug_post_media_update" on public.blugbug_post_media
for update using (user_id = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()))
with check (user_id = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()));
create policy "blugbug_post_media_delete" on public.blugbug_post_media
for delete using (user_id = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blugbug_post_media', 'blugbug_post_media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "blugbug_post_media_objects_read" on storage.objects
for select using (bucket_id = 'blugbug_post_media');
create policy "blugbug_post_media_objects_insert" on storage.objects
for insert to authenticated with check (
  bucket_id = 'blugbug_post_media'
  and ((storage.foldername(name))[1] = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()))
);
create policy "blugbug_post_media_objects_update" on storage.objects
for update to authenticated using (
  bucket_id = 'blugbug_post_media'
  and ((storage.foldername(name))[1] = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()))
) with check (
  bucket_id = 'blugbug_post_media'
  and ((storage.foldername(name))[1] = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()))
);
create policy "blugbug_post_media_objects_delete" on storage.objects
for delete to authenticated using (
  bucket_id = 'blugbug_post_media'
  and ((storage.foldername(name))[1] = (select blugbug_private.current_profile_id()) or (select blugbug_private.is_admin()))
);

grant select on public.blugbug_post_media to anon, authenticated;
grant insert, update, delete on public.blugbug_post_media to authenticated;

commit;

-- Privacy-conscious daily unique Blug views. Guests use a random browser token;
-- only its one-way MD5 identifier is retained.

alter table public.blugbug_posts
  add column if not exists view_count bigint not null default 0
  check (view_count >= 0);

create table if not exists public.blugbug_post_views (
  post_id uuid not null references public.blugbug_posts(id) on delete cascade,
  viewer_key text not null,
  viewed_on date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (post_id, viewer_key, viewed_on)
);

create index if not exists blugbug_post_views_post_idx
  on public.blugbug_post_views(post_id, viewed_on desc);

alter table public.blugbug_post_views enable row level security;

create or replace function public.blugbug_record_post_view(
  target_post_id uuid,
  visitor_token text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_id text;
  resolved_viewer_key text;
  inserted_rows integer;
  current_count bigint;
begin
  select id into profile_id
  from public.blugbug_users
  where auth_user_id = auth.uid()
  limit 1;

  if profile_id is not null then
    resolved_viewer_key := 'user:' || md5(profile_id);
  elsif visitor_token is not null and char_length(visitor_token) between 16 and 200 then
    resolved_viewer_key := 'guest:' || md5(visitor_token);
  else
    select view_count into current_count
    from public.blugbug_posts
    where id = target_post_id and status = 'published';
    return coalesce(current_count, 0);
  end if;

  if not exists (
    select 1 from public.blugbug_posts
    where id = target_post_id and status = 'published'
  ) then
    return 0;
  end if;

  insert into public.blugbug_post_views(post_id, viewer_key)
  values (target_post_id, resolved_viewer_key)
  on conflict do nothing;
  get diagnostics inserted_rows = row_count;

  if inserted_rows = 1 then
    update public.blugbug_posts
    set view_count = view_count + 1
    where id = target_post_id
    returning view_count into current_count;
  else
    select view_count into current_count
    from public.blugbug_posts
    where id = target_post_id;
  end if;

  return coalesce(current_count, 0);
end;
$$;

revoke all on public.blugbug_post_views from anon, authenticated;
revoke all on function public.blugbug_record_post_view(uuid, text) from public;
grant execute on function public.blugbug_record_post_view(uuid, text) to anon, authenticated;


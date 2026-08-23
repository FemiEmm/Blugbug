begin;

-- Legacy email addresses remain outside the publicly readable profile table.
-- This RPC exposes them only after confirming that the caller is a Blugbug
-- administrator, allowing Admin Studio to review recovery accounts safely.
create or replace function public.blugbug_admin_list_users()
returns table (
  id text,
  username text,
  email text,
  full_name text,
  chatter_name text,
  about_me text,
  profile_image_url text,
  header_image_url text,
  account_type text,
  account_status text,
  recovery_status text,
  recovery_requested_at timestamptz,
  recovery_approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not blugbug_private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    users.id,
    users.username,
    legacy.legacy_email,
    users.full_name,
    users.chatter_name,
    users.about_me,
    users.profile_image_url,
    users.header_image_url,
    users.account_type,
    users.account_status,
    users.recovery_status,
    users.recovery_requested_at,
    users.recovery_approved_at,
    users.created_at,
    users.updated_at
  from public.blugbug_users as users
  left join public.blugbug_legacy_accounts as legacy
    on legacy.user_id = users.id
  order by users.created_at desc;
end;
$$;

revoke all on function public.blugbug_admin_list_users() from public, anon;
grant execute on function public.blugbug_admin_list_users() to authenticated;

commit;

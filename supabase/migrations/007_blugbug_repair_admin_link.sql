-- Repairs the original local administrator after a data push detached its
-- Supabase Auth UUID. Safe for the shared Supabase project: only Blugbug-owned
-- rows and the exact Blugbug administrator email/profile are touched.
begin;

do $$
declare
  admin_auth_id uuid;
  conflicting_profile text;
begin
  select id into admin_auth_id
  from auth.users
  where lower(email) = lower('admin@admin.com')
  order by created_at
  limit 1;

  if admin_auth_id is null then
    raise exception 'No Supabase Auth user exists for admin@admin.com';
  end if;

  select id into conflicting_profile
  from public.blugbug_users
  where auth_user_id = admin_auth_id and id <> 'local-admin'
  limit 1;

  if conflicting_profile is not null then
    raise exception 'Auth user is already linked to Blugbug profile %', conflicting_profile;
  end if;

  update public.blugbug_users
  set auth_user_id = admin_auth_id,
      account_type = 'person',
      account_status = 'active',
      updated_at = now()
  where id = 'local-admin';

  if not found then
    raise exception 'The local-admin profile does not exist in blugbug_users';
  end if;

  insert into public.blugbug_admins(auth_user_id)
  values(admin_auth_id)
  on conflict (auth_user_id) do nothing;
end;
$$;

commit;

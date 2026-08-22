begin;

create or replace function public.blugbug_claim_legacy_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_id uuid := (select auth.uid());
  verified_email text;
  legacy public.blugbug_legacy_accounts%rowtype;
  existing_profile_id text;
begin
  if auth_id is null then raise exception 'Authentication required'; end if;

  select lower(email) into verified_email
  from auth.users
  where id = auth_id and email_confirmed_at is not null;
  if verified_email is null then raise exception 'Verify your email before recovering an account'; end if;

  select id into existing_profile_id
  from public.blugbug_users where auth_user_id = auth_id;
  if existing_profile_id is not null then
    return jsonb_build_object('user_id', existing_profile_id, 'already_claimed', true);
  end if;

  select * into legacy
  from public.blugbug_legacy_accounts
  where lower(legacy_email) = verified_email
  for update;
  if not found then raise exception 'No recoverable Blugbug account matches this email'; end if;
  if legacy.claimed_auth_user_id is not null then raise exception 'This Blugbug account has already been recovered'; end if;

  update public.blugbug_users
  set auth_user_id = auth_id, updated_at = now()
  where id = legacy.user_id and auth_user_id is null and account_type = 'person';
  if not found then raise exception 'This profile cannot be recovered automatically'; end if;

  update public.blugbug_legacy_accounts
  set claimed_auth_user_id = auth_id, claimed_at = now()
  where user_id = legacy.user_id;

  return jsonb_build_object('user_id', legacy.user_id, 'already_claimed', false);
end;
$$;

revoke all on function public.blugbug_claim_legacy_account() from public, anon;
grant execute on function public.blugbug_claim_legacy_account() to authenticated;

commit;

begin;

alter table public.blugbug_users
  add column if not exists recovery_status text not null default 'approved'
    check (recovery_status in ('approved', 'pending')),
  add column if not exists recovery_requested_at timestamptz,
  add column if not exists recovery_approved_at timestamptz;

create extension if not exists pgcrypto with schema extensions;

-- Answers are compared only inside trusted server code. Store normalized
-- answers as bcrypt hashes made with PostgreSQL crypt() and gen_salt('bf').
create or replace function public.blugbug_verify_legacy_answer(recovery_email text, supplied_answer text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(case
    when secret_answer_hash like 'sha256:%' then
      secret_answer_hash = 'sha256:' || encode(extensions.digest(regexp_replace(lower(supplied_answer), '[^a-z0-9]', '', 'g'), 'sha256'), 'hex')
    else extensions.crypt(regexp_replace(lower(supplied_answer), '[^a-z0-9]', '', 'g'), secret_answer_hash) = secret_answer_hash
  end, false)
  from public.blugbug_legacy_accounts
  where lower(legacy_email) = lower(recovery_email)
    and secret_answer_hash is not null;
$$;
revoke all on function public.blugbug_verify_legacy_answer(text, text) from public, anon, authenticated;
grant execute on function public.blugbug_verify_legacy_answer(text, text) to service_role;

-- A pending recovery can use Blugbug normally, but cannot alter its public
-- identity until an administrator approves it.
create or replace function blugbug_private.protect_pending_recovery_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null
     and old.auth_user_id = (select auth.uid())
     and not blugbug_private.is_admin() then
    if old.recovery_status = 'pending' and (
      new.username is distinct from old.username or
      new.chatter_name is distinct from old.chatter_name or
      new.full_name is distinct from old.full_name or
      new.about_me is distinct from old.about_me or
      new.profile_image_url is distinct from old.profile_image_url or
      new.header_image_url is distinct from old.header_image_url
    ) then
      raise exception 'Profile changes are pending administrator approval';
    end if;
    if new.recovery_status is distinct from old.recovery_status
       or new.recovery_requested_at is distinct from old.recovery_requested_at
       or new.recovery_approved_at is distinct from old.recovery_approved_at then
      raise exception 'Only an administrator can change recovery approval';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists blugbug_protect_pending_recovery_profile on public.blugbug_users;
create trigger blugbug_protect_pending_recovery_profile
before update on public.blugbug_users
for each row execute function blugbug_private.protect_pending_recovery_profile();

grant update (recovery_status, recovery_requested_at, recovery_approved_at)
on public.blugbug_users to authenticated;

commit;

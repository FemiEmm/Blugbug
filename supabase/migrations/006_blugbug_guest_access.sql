begin;

alter table public.blugbug_comments alter column user_id drop not null;
alter table public.blugbug_comments add column if not exists guest_name text;
alter table public.blugbug_comments add column if not exists guest_token_hash text;
alter table public.blugbug_comments drop constraint if exists blugbug_comments_author_check;
alter table public.blugbug_comments add constraint blugbug_comments_author_check
  check ((user_id is not null and guest_name is null and guest_token_hash is null)
      or (user_id is null and char_length(btrim(guest_name)) between 2 and 40 and char_length(guest_token_hash)=64));

alter table public.blugbug_comment_replies alter column user_id drop not null;
alter table public.blugbug_comment_replies add column if not exists guest_name text;
alter table public.blugbug_comment_replies add column if not exists guest_token_hash text;
alter table public.blugbug_comment_replies drop constraint if exists blugbug_replies_author_check;
alter table public.blugbug_comment_replies add constraint blugbug_replies_author_check
  check ((user_id is not null and guest_name is null and guest_token_hash is null)
      or (user_id is null and char_length(btrim(guest_name)) between 2 and 40 and char_length(guest_token_hash)=64));

drop policy if exists "blugbug_comments_guest_insert" on public.blugbug_comments;
create policy "blugbug_comments_guest_insert" on public.blugbug_comments for insert to anon
with check (user_id is null and status='visible' and guest_name is not null and guest_token_hash ~ '^[0-9a-f]{64}$');
drop policy if exists "blugbug_replies_guest_insert" on public.blugbug_comment_replies;
create policy "blugbug_replies_guest_insert" on public.blugbug_comment_replies for insert to anon
with check (user_id is null and status='visible' and guest_name is not null and guest_token_hash ~ '^[0-9a-f]{64}$');

grant insert on public.blugbug_comments, public.blugbug_comment_replies to anon;

-- New public signups receive a Blugbug profile automatically. Recovery-created
-- auth users do not carry this marker, so this does not interfere with recovery.
create or replace function blugbug_private.create_signup_profile()
returns trigger language plpgsql security definer
set search_path = public, auth, pg_temp as $$
declare
  requested_handle text;
  requested_name text;
begin
  if coalesce(new.raw_user_meta_data->>'blugbug_signup', 'false') <> 'true' then
    return new;
  end if;
  requested_handle := regexp_replace(coalesce(new.raw_user_meta_data->>'chatter_name', ''), '^@', '');
  requested_name := btrim(coalesce(new.raw_user_meta_data->>'full_name', ''));
  if requested_handle !~ '^[A-Za-z0-9._-]{2,40}$' or char_length(requested_name) not between 1 and 100 then
    raise exception 'Invalid Blugbug profile details';
  end if;
  insert into public.blugbug_users(auth_user_id, username, chatter_name, full_name, about_me, account_type, account_status)
  values(new.id, requested_handle, requested_handle, requested_name, '', 'person', 'active');
  return new;
end;
$$;

drop trigger if exists blugbug_create_signup_profile on auth.users;
create trigger blugbug_create_signup_profile
after insert on auth.users for each row execute function blugbug_private.create_signup_profile();

commit;

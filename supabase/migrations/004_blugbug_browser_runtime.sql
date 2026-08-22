begin;

-- Safe browser-visible admin check. This reveals only whether the caller is an
-- administrator; it never exposes the private administrator table.
create or replace function public.blugbug_am_i_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select blugbug_private.is_admin();
$$;
revoke all on function public.blugbug_am_i_admin() from public, anon;
grant execute on function public.blugbug_am_i_admin() to authenticated;

drop policy if exists "blugbug_notifications_admin_delete" on public.blugbug_notifications;
create policy "blugbug_notifications_admin_delete" on public.blugbug_notifications
for delete to authenticated using ((select blugbug_private.is_admin()));

-- Activity is generated in the database, so it works from Netlify and does not
-- depend on the laptop API being online.
create or replace function blugbug_private.notify_social_action()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient text; actor text; post_ref uuid; actor_label text; note_type text; note_message text;
begin
  if tg_table_name = 'blugbug_follows' then recipient:=new.followed_id;actor:=new.follower_id;note_type:='follow';note_message:='followed you.';
  elsif tg_table_name = 'blugbug_post_likes' then select p.user_id,p.id into recipient,post_ref from public.blugbug_posts p where p.id=new.post_id;actor:=new.user_id;note_type:='like';note_message:='liked your blug.';
  elsif tg_table_name = 'blugbug_comments' then select p.user_id,p.id into recipient,post_ref from public.blugbug_posts p where p.id=new.post_id;actor:=new.user_id;note_type:='comment';note_message:='commented on your blug.';
  elsif tg_table_name = 'blugbug_comment_replies' then select c.user_id,c.post_id into recipient,post_ref from public.blugbug_comments c where c.id=new.comment_id;actor:=new.user_id;note_type:='reply';note_message:='replied to your comment.';
  elsif tg_table_name = 'blugbug_paragraph_questions' then select p.user_id,p.id into recipient,post_ref from public.blugbug_posts p where p.id=new.post_id;actor:=new.user_id;note_type:='paragraph_question';note_message:='asked a question about a paragraph in your blug.';
  elsif tg_table_name = 'blugbug_paragraph_answers' then select q.user_id,q.post_id into recipient,post_ref from public.blugbug_paragraph_questions q where q.id=new.question_id;actor:=new.user_id;note_type:='paragraph_answer';note_message:='answered your paragraph question.';
  end if;
  if recipient is null or recipient=actor then return new; end if;
  select coalesce(nullif(full_name,''),chatter_name) into actor_label from public.blugbug_users where id=actor;
  insert into public.blugbug_notifications(user_id,actor_id,type,message,post_id) values(recipient,actor,note_type,coalesce(actor_label,'A blugger')||' '||note_message,post_ref);
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['blugbug_follows','blugbug_post_likes','blugbug_comments','blugbug_comment_replies','blugbug_paragraph_questions','blugbug_paragraph_answers'] loop
    execute format('drop trigger if exists %I on public.%I','blugbug_notify_'||t,t);
    execute format('create trigger %I after insert on public.%I for each row execute function blugbug_private.notify_social_action()','blugbug_notify_'||t,t);
  end loop;
end $$;

create or replace function blugbug_private.notify_followers_new_post()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
    insert into public.blugbug_notifications(user_id,actor_id,type,message,post_id)
    select f.follower_id,new.user_id,'new_post',u.full_name||' published a new blug.',new.id
    from public.blugbug_follows f join public.blugbug_users u on u.id=new.user_id
    where f.followed_id=new.user_id and f.follower_id<>new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists blugbug_notify_new_post on public.blugbug_posts;
create trigger blugbug_notify_new_post after insert or update of status on public.blugbug_posts
for each row execute function blugbug_private.notify_followers_new_post();

commit;

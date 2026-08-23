begin;

alter table public.blugbug_comments
  add column if not exists quote_text text;

alter table public.blugbug_comments
  drop constraint if exists blugbug_comments_quote_length;
alter table public.blugbug_comments
  add constraint blugbug_comments_quote_length
  check (quote_text is null or char_length(btrim(quote_text)) between 1 and 300);

-- A quoted opinion remains a normal comment, but its notification tells the
-- blug owner that a specific part of their writing was quoted.
create or replace function blugbug_private.notify_social_action()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient text; actor text; post_ref uuid; actor_label text; note_type text; note_message text;
begin
  if tg_table_name = 'blugbug_follows' then recipient:=new.followed_id;actor:=new.follower_id;note_type:='follow';note_message:='followed you.';
  elsif tg_table_name = 'blugbug_post_likes' then select p.user_id,p.id into recipient,post_ref from public.blugbug_posts p where p.id=new.post_id;actor:=new.user_id;note_type:='like';note_message:='liked your blug.';
  elsif tg_table_name = 'blugbug_comments' then
    select p.user_id,p.id into recipient,post_ref from public.blugbug_posts p where p.id=new.post_id;
    actor:=new.user_id;
    if new.quote_text is not null then note_type:='quote';note_message:='quoted a passage from your blug and added an opinion.';
    else note_type:='comment';note_message:='commented on your blug.'; end if;
  elsif tg_table_name = 'blugbug_comment_replies' then select c.user_id,c.post_id into recipient,post_ref from public.blugbug_comments c where c.id=new.comment_id;actor:=new.user_id;note_type:='reply';note_message:='replied to your comment.';
  elsif tg_table_name = 'blugbug_paragraph_questions' then select p.user_id,p.id into recipient,post_ref from public.blugbug_posts p where p.id=new.post_id;actor:=new.user_id;note_type:='paragraph_question';note_message:='asked a question about a paragraph in your blug.';
  elsif tg_table_name = 'blugbug_paragraph_answers' then select q.user_id,q.post_id into recipient,post_ref from public.blugbug_paragraph_questions q where q.id=new.question_id;actor:=new.user_id;note_type:='paragraph_answer';note_message:='answered your paragraph question.';
  end if;
  if recipient is null or recipient=actor then return new; end if;
  select coalesce(nullif(full_name,''),chatter_name) into actor_label from public.blugbug_users where id=actor;
  insert into public.blugbug_notifications(user_id,actor_id,type,message,post_id)
  values(recipient,actor,note_type,coalesce(actor_label,'A reader')||' '||note_message,post_ref);
  return new;
end $$;

commit;

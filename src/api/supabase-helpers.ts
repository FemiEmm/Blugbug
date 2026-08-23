import { supabase } from '../lib/supabase';
import type { LocalPost, LocalUser } from './types';

export const throwIf = (error: any) => { if (error) throw error; };
export const currentProfileId = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser(); throwIf(authError);
  if (!user) throw new Error('Authentication required.');
  const { data, error } = await supabase.from('blugbug_users').select('id').eq('auth_user_id', user.id).single(); throwIf(error);
  if (!data) throw new Error('This login is not linked to a Blugbug profile.');
  return data.id as string;
};
export const mapUser = (row: any): LocalUser => ({
  id:row.id,username:row.username,email:'',full_name:row.full_name,chatter_name:row.chatter_name,about_me:row.about_me||'',
  profile_image_url:row.profile_image_url,header_image_url:row.header_image_url,role:'user',recovery_status:row.recovery_status||'approved',recovery_requested_at:row.recovery_requested_at,recovery_approved_at:row.recovery_approved_at,created_at:row.created_at,updated_at:row.updated_at,
});
export const mapPost = (row: any): LocalPost => {
  const author = Array.isArray(row.blugbug_users) ? row.blugbug_users[0] : row.blugbug_users;
  const topic = Array.isArray(row.blugbug_topics) ? row.blugbug_topics[0] : row.blugbug_topics;
  return { id:row.id,user_id:row.user_id,title:row.title,content:row.content_html||'',categories:topic?.name||'',status:row.status,
    header_image_url:row.cover_image_url,created_at:row.created_at,updated_at:row.updated_at,
    full_name:author?.full_name,chatter_name:author?.chatter_name,profile_image_url:author?.profile_image_url };
};
export const postSelect = '*,blugbug_users!blugbug_posts_user_id_fkey(full_name,chatter_name,profile_image_url),blugbug_topics(name)';
export const topicId = async (name?: string) => {
  if (!name) return null;
  const { data, error } = await supabase.from('blugbug_topics').select('id').ilike('name', name).maybeSingle(); throwIf(error);
  return data?.id || null;
};

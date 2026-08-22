import { supabase } from '../lib/supabase';
import type { LocalUser } from './types';

const profileToUser = (profile: any, email = '', isAdmin = false): LocalUser => ({
  id: profile.id, username: profile.username, email, full_name: profile.full_name,
  chatter_name: profile.chatter_name, about_me: profile.about_me || '',
  profile_image_url: profile.profile_image_url, header_image_url: profile.header_image_url,
  role: isAdmin ? 'admin' : 'user', created_at: profile.created_at, updated_at: profile.updated_at,
});

const loadProfile = async () => {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) throw authError || new Error('Authentication required.');
  const { data: profile, error } = await supabase.from('blugbug_users').select('*').eq('auth_user_id', authUser.id).single();
  if (error || !profile) throw new Error('This Supabase login is not linked to a Blugbug profile.');
  const { data: admin } = await supabase.rpc('blugbug_am_i_admin');
  return profileToUser(profile, authUser.email || '', Boolean(admin));
};

export const login = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return { user: await loadProfile() };
};
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Authentication required.');
  return { user: await loadProfile() };
};
export const logout = async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; };
export const loginWithSupabase = async () => ({ user: await loadProfile() });

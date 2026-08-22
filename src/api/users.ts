import { supabase } from '../lib/supabase';
import type { LocalUser } from './types';
import { mapUser, throwIf } from './supabase-helpers';

export const getUser = async (id:string) => { const{data,error}=await supabase.from('blugbug_users').select('*').eq('id',id).single();throwIf(error);return{user:mapUser(data)}; };
export const listUsers = async (search='') => { let query=supabase.from('blugbug_users').select('*').eq('account_status','active').order('created_at',{ascending:false}).limit(50);if(search)query=query.or(`full_name.ilike.%${search.replaceAll(',','')}%,chatter_name.ilike.%${search.replaceAll(',','')}%`);const{data,error}=await query;throwIf(error);return{users:(data||[]).map(mapUser)}; };
export const updateUser = async (id:string,changes:Partial<LocalUser>) => { const allowed:any={};for(const key of ['full_name','chatter_name','about_me','profile_image_url','header_image_url'])if(changes[key as keyof LocalUser]!==undefined)allowed[key]=changes[key as keyof LocalUser];const{data,error}=await supabase.from('blugbug_users').update(allowed).eq('id',id).select().single();throwIf(error);return{user:mapUser(data)}; };

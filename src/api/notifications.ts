import { supabase } from '../lib/supabase';
import { throwIf } from './supabase-helpers';
export interface LocalNotification{id:string;message:string;post_id:string|null;actor_id?:string|null;actor_name?:string|null;actor_handle?:string|null;actor_image?:string|null;read:boolean;type:string;created_at:string}
const map=(r:any):LocalNotification=>({id:r.id,message:r.message,post_id:r.post_id,actor_id:r.actor_id,read:Boolean(r.read),type:r.type,created_at:r.created_at,actor_name:r.actor?.full_name??null,actor_handle:r.actor?.chatter_name??null,actor_image:r.actor?.profile_image_url??null});
export async function listNotifications(){const{data,error}=await supabase.from('blugbug_notifications').select('id,message,post_id,actor_id,read,type,created_at,actor:blugbug_users!blugbug_notifications_actor_id_fkey(full_name,chatter_name,profile_image_url)').order('created_at',{ascending:false});throwIf(error);return{notifications:(data??[]).map(map)}}
export async function markNotificationRead(id:string){const{error}=await supabase.from('blugbug_notifications').update({read:true}).eq('id',id);throwIf(error)}
export async function markAllNotificationsRead(){const{error}=await supabase.from('blugbug_notifications').update({read:true}).eq('read',false);throwIf(error)}

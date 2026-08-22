import { supabase } from '../lib/supabase';
import { currentProfileId, throwIf } from './supabase-helpers';
export interface SupportCase{id:string;subject:string;status:'open'|'resolved'|'closed';created_at:string;updated_at:string}
export interface SupportMessage{id:string;body:string;chatter_name:string;role:string;created_at:string}
export async function listCases(){const{data,error}=await supabase.from('blugbug_support_cases').select('*').order('updated_at',{ascending:false});throwIf(error);return{cases:(data??[]) as SupportCase[]}}
export async function createCase(subject:string,body:string){const user_id=await currentProfileId();const{data,error}=await supabase.from('blugbug_support_cases').insert({user_id,subject:subject.trim()}).select().single();throwIf(error);const{error:e}=await supabase.from('blugbug_support_messages').insert({case_id:data.id,user_id,body:body.trim()});throwIf(e);return{case:data as SupportCase}}
export async function listMessages(id:string){const{data,error}=await supabase.from('blugbug_support_messages').select('id,body,created_at,user:blugbug_users!blugbug_support_messages_user_id_fkey(chatter_name)').eq('case_id',id).order('created_at');throwIf(error);return{messages:(data??[]).map((x:any)=>({id:x.id,body:x.body,created_at:x.created_at,chatter_name:x.user?.chatter_name??'blugger',role:'user'})) as SupportMessage[]}}
export async function addMessage(id:string,body:string){const user_id=await currentProfileId();const{error}=await supabase.from('blugbug_support_messages').insert({case_id:id,user_id,body:body.trim()});throwIf(error)}
export async function setCaseStatus(id:string,status:SupportCase['status']){const{error}=await supabase.from('blugbug_support_cases').update({status}).eq('id',id);throwIf(error)}

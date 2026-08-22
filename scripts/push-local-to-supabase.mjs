import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const dbPath = path.join(root, 'data', 'blugbug.sqlite');
const uploadsRoot = path.join(root, 'data', 'uploads');
const reportRoot = path.join(root, 'data', 'supabase-push-reports');
const backupRoot = path.join(root, 'data', 'supabase-push-backups');
const stagingRoot = path.join(root, 'data', 'supabase-push-staging');
const apply = process.argv.includes('--apply');
const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const secret = process.env.SUPABASE_SECRET_KEY || '';
if (!supabaseUrl || !secret) throw new Error('VITE_SUPABASE_URL and SUPABASE_SECRET_KEY are required.');

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const stableUuid = (scope, value) => {
  if (uuidPattern.test(String(value))) return String(value).toLowerCase();
  const bytes = crypto.createHash('sha256').update(`blugbug:${scope}:${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const iso = (value) => {
  if (!value) return new Date().toISOString();
  const raw = String(value); const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw.replace(' ', 'T')}Z`);
  return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
};
const strip = (html = '') => String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const safeSegment = (value) => encodeURIComponent(String(value).replaceAll('/', '_'));
const headers = { apikey: secret, Authorization: `Bearer ${secret}` };
const request = async (pathname, options = {}) => {
  const response = await fetch(`${supabaseUrl}${pathname}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${pathname}: ${response.status} ${await response.text()}`);
  if (response.status === 204 || response.headers.get('content-length') === '0') return null;
  return response.json().catch(() => null);
};
const rest = (table, query = '') => request(`/rest/v1/${table}${query}`);
const upsert = async (table, rows, conflict) => {
  if (!rows.length) return;
  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100);
    await request(`/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(batch),
    });
  }
};
const publicStorageUrl = (bucket, objectPath) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
const localAsset = (url) => {
  if (!url?.startsWith('/uploads/')) return null;
  const relative = decodeURIComponent(url.slice('/uploads/'.length)).replaceAll('/', path.sep);
  const absolute = path.resolve(uploadsRoot, relative);
  return absolute.startsWith(path.resolve(uploadsRoot) + path.sep) ? absolute : null;
};
const contentType = (file) => ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' })[path.extname(file).toLowerCase()] || 'application/octet-stream';
const assetPlan = new Map();
const planAsset = (url, bucket, objectPath) => {
  let file = localAsset(url); if (!file) return url || null;
  const limit = bucket === 'blugbug_profiles' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  if (fs.statSync(file).size > limit) {
    const fingerprint = crypto.createHash('sha256').update(file).digest('hex').slice(0, 20);
    const optimized = path.join(stagingRoot, `${fingerprint}.webp`);
    if (!fs.existsSync(optimized)) execFileSync('python', [path.join(root, 'scripts', 'optimize-migration-image.py'), file, optimized, bucket === 'blugbug_profiles' ? '1200' : '2400']);
    file = optimized;
    objectPath = objectPath.replace(/\.[^.\/]+$/, '') + '.webp';
  }
  assetPlan.set(`${bucket}/${objectPath}`, { bucket, objectPath, file });
  return publicStorageUrl(bucket, objectPath);
};
const uploadAssets = async () => {
  for (const asset of assetPlan.values()) {
    const body = fs.readFileSync(asset.file);
    await request(`/storage/v1/object/${asset.bucket}/${asset.objectPath.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST', headers: { 'Content-Type': contentType(asset.file), 'x-upsert': 'true' }, body,
    });
  }
};

const local = Object.fromEntries(['users','posts','follows','post_likes','bookmarks','comments','comment_replies','notifications','paragraph_questions','post_media','support_cases','support_messages']
  .map((table) => [table, db.prepare(`select * from ${table}`).all()]));
const postId = new Map(local.posts.map((row) => [row.id, stableUuid('post', row.id)]));
const commentId = new Map(local.comments.map((row) => [row.id, stableUuid('comment', row.id)]));
const questionId = new Map(local.paragraph_questions.map((row) => [row.id, stableUuid('question', row.id)]));
const supportId = new Map(local.support_cases.map((row) => [row.id, stableUuid('support-case', row.id)]));

const topicRows = await rest('blugbug_topics', '?select=id,name,slug');
const topics = new Map(topicRows.map((row) => [String(row.name).toLowerCase(), row.id]));
const usedHandles = new Set();
const usedUsernames = new Set();
const safeHandle = (value, id) => {
  let handle = String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9._-]+/g, '-').replace(/^[-._]+|[-._]+$/g, '').slice(0, 40);
  if (handle.length < 2) handle = `blugger-${stableUuid('handle', id).slice(0, 8)}`;
  const base = handle.slice(0, 31); let suffix = 1;
  while (usedHandles.has(handle)) handle = `${base}-${suffix++}`;
  usedHandles.add(handle); return handle;
};
const safeUsername = (value, id) => {
  let username = String(value || '').trim().slice(0, 60);
  if (username.length < 2) username = `blugger-${stableUuid('username', id).slice(0, 8)}`;
  const base = username.slice(0, 50); let suffix = 1;
  while (usedUsernames.has(username.toLowerCase())) username = `${base}-${suffix++}`;
  usedUsernames.add(username.toLowerCase()); return username;
};
const users = local.users.map((row) => {
  const profileFile = localAsset(row.profile_image_url); const headerFile = localAsset(row.header_image_url);
  return {
    id: row.id, auth_user_id: null, username: safeUsername(row.username || row.chatter_name, row.id), chatter_name: safeHandle(row.chatter_name, row.id), full_name: String(row.full_name || row.chatter_name || 'Blugbug user').slice(0, 100),
    about_me: String(row.about_me || '').slice(0, 500),
    profile_image_url: profileFile ? planAsset(row.profile_image_url, 'blugbug_profiles', `${safeSegment(row.id)}/${path.basename(profileFile)}`) : row.profile_image_url,
    header_image_url: headerFile ? planAsset(row.header_image_url, 'blugbug_headers', `${safeSegment(row.id)}/${path.basename(headerFile)}`) : row.header_image_url,
    account_type: row.id.startsWith('channel-') ? 'channel' : 'person', account_status: 'active', created_at: iso(row.created_at), updated_at: iso(row.updated_at),
  };
});
const legacyAccounts = local.users.filter((row) => row.email && !row.email.endsWith('@sample.blugbug') && !row.email.endsWith('@blugbug.local'))
  .map((row) => ({ user_id: row.id, legacy_email: row.email }));
const posts = local.posts.map((row) => {
  const remoteId = postId.get(row.id); const coverFile = localAsset(row.header_image_url);
  const cover = coverFile ? planAsset(row.header_image_url, 'blugbug_post_covers', `${safeSegment(row.user_id)}/${remoteId}/${path.basename(coverFile)}`) : row.header_image_url;
  return { id: remoteId, legacy_id: row.id, user_id: row.user_id, topic_id: topics.get(String(row.categories || '').toLowerCase()) || null,
    title: row.title, content_html: row.content || '', excerpt: strip(row.content).slice(0, 500), cover_image_url: cover,
    status: ['draft','published','archived'].includes(row.status) ? row.status : 'published', reply_permission: 'everyone',
    published_at: row.status === 'draft' ? null : iso(row.created_at), created_at: iso(row.created_at), updated_at: iso(row.updated_at) };
});
const media = local.post_media.map((row) => {
  const remotePostId = postId.get(row.post_id); const file = localAsset(row.public_url); const extension = file ? path.extname(file) : '';
  const objectPath = `${safeSegment(row.user_id)}/${remotePostId}/${stableUuid('media', row.id)}${extension}`;
  const url = file ? planAsset(row.public_url, 'blugbug_post_media', objectPath) : row.public_url;
  const post = posts.find((item) => item.id === remotePostId);
  if (post && row.public_url && url) post.content_html = post.content_html.split(row.public_url).join(url);
  return { id: stableUuid('media', row.id), post_id: remotePostId, user_id: row.user_id, storage_path: objectPath, alt_text: row.alt_text,
    caption: row.caption || '', mime_type: row.mime_type, byte_size: row.byte_size, created_at: iso(row.created_at), updated_at: iso(row.updated_at) };
});
const follows = local.follows.map((r) => ({ follower_id:r.follower_id, followed_id:r.followed_id, created_at:iso(r.created_at) }));
const likes = local.post_likes.map((r) => ({ post_id:postId.get(r.post_id), user_id:r.user_id, created_at:iso(r.created_at) })).filter((r)=>r.post_id);
const bookmarks = local.bookmarks.map((r) => ({ post_id:postId.get(r.post_id), user_id:r.user_id, created_at:iso(r.created_at) })).filter((r)=>r.post_id);
const comments = local.comments.map((r) => ({ id:commentId.get(r.id), legacy_id:r.id, post_id:postId.get(r.post_id), user_id:r.user_id, body:String(r.body).slice(0,2000), status:'visible', created_at:iso(r.created_at), updated_at:iso(r.updated_at) })).filter((r)=>r.post_id);
const replies = local.comment_replies.map((r) => ({ id:stableUuid('reply',r.id), legacy_id:r.id, comment_id:commentId.get(r.comment_id), user_id:r.user_id, body:String(r.body).slice(0,2000), status:'visible', created_at:iso(r.created_at), updated_at:iso(r.updated_at) })).filter((r)=>r.comment_id);
const questions = local.paragraph_questions.map((r) => ({ id:questionId.get(r.id), post_id:postId.get(r.post_id), paragraph_index:r.paragraph_index, user_id:r.user_id, body:String(r.body).slice(0,1000), status:r.author_response?'answered':'open', created_at:iso(r.created_at), updated_at:iso(r.updated_at) })).filter((r)=>r.post_id);
const answers = local.paragraph_questions.filter((r)=>r.author_response).map((r)=>({ id:stableUuid('paragraph-answer',r.id), question_id:questionId.get(r.id), user_id:local.posts.find((p)=>p.id===r.post_id)?.user_id || r.user_id, body:String(r.author_response).slice(0,2000), created_at:iso(r.updated_at), updated_at:iso(r.updated_at) }));
const validNotificationTypes = new Set(['follow','like','comment','reply','share','new_post','paragraph_question','paragraph_answer','mention','system']);
const notifications = local.notifications.map((r)=>({ id:stableUuid('notification',r.id), user_id:r.user_id, actor_id:r.actor_id||null, type:validNotificationTypes.has(r.type)?r.type:'system', message:String(r.message).slice(0,500), post_id:r.post_id?postId.get(r.post_id)||null:null, read:Boolean(r.read), created_at:iso(r.created_at) }));
const supportCases = local.support_cases.map((r)=>({ id:supportId.get(r.id), user_id:r.user_id, subject:r.subject, status:r.status, created_at:iso(r.created_at), updated_at:iso(r.updated_at) }));
const supportMessages = local.support_messages.map((r)=>({ id:stableUuid('support-message',r.id), case_id:supportId.get(r.case_id), user_id:r.user_id, body:r.body, created_at:iso(r.created_at) })).filter((r)=>r.case_id);

const missingAssets = [...assetPlan.values()].filter((asset) => !fs.existsSync(asset.file)).map((asset) => asset.file);
const plan = { users, legacyAccounts, posts, media, follows, likes, bookmarks, comments, replies, questions, answers, notifications, supportCases, supportMessages };
const plannedCounts = Object.fromEntries(Object.entries(plan).map(([key,value])=>[key,value.length]));
const remoteBefore = {};
for (const table of ['blugbug_users','blugbug_posts','blugbug_comments','blugbug_comment_replies','blugbug_notifications','blugbug_post_media']) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, { method:'HEAD', headers:{...headers,Prefer:'count=exact'} });
  remoteBefore[table] = Number((response.headers.get('content-range') || '/0').split('/')[1] || 0);
}
if (missingAssets.length) throw new Error(`Missing ${missingAssets.length} local assets. First: ${missingAssets[0]}`);

const stamp = new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
fs.mkdirSync(reportRoot,{recursive:true});
if (apply) {
  const backupDir=path.join(backupRoot,stamp); fs.mkdirSync(backupDir,{recursive:true});
  for(const suffix of ['','-wal','-shm']){const source=`${dbPath}${suffix}`;if(fs.existsSync(source))fs.copyFileSync(source,path.join(backupDir,path.basename(source)))}
  await uploadAssets();
  await upsert('blugbug_users',users,'id'); await upsert('blugbug_legacy_accounts',legacyAccounts,'user_id');
  await upsert('blugbug_posts',posts,'id'); await upsert('blugbug_post_media',media,'id');
  await upsert('blugbug_follows',follows,'follower_id,followed_id'); await upsert('blugbug_post_likes',likes,'post_id,user_id'); await upsert('blugbug_bookmarks',bookmarks,'post_id,user_id');
  await upsert('blugbug_comments',comments,'id'); await upsert('blugbug_comment_replies',replies,'id');
  await upsert('blugbug_paragraph_questions',questions,'id'); await upsert('blugbug_paragraph_answers',answers,'id');
  await upsert('blugbug_notifications',notifications,'id'); await upsert('blugbug_support_cases',supportCases,'id'); await upsert('blugbug_support_messages',supportMessages,'id');
}
const report={apply,plannedCounts,assets:assetPlan.size,missingAssets,remoteBefore,completedAt:new Date().toISOString()};
const reportPath=path.join(reportRoot,`supabase-${apply?'push':'dry-run'}-${stamp}.json`);fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,reportPath},null,2));
db.close();

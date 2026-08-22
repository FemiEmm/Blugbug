import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import sanitizeHtml from 'sanitize-html';

const projectDir = path.resolve(import.meta.dirname, '..');
const sqlPath = path.join(projectDir, 'tmp', 'old-supabase.backup');
const storageRoot = path.join(projectDir, 'data', 'import-staging', 'old-supabase-storage');
const dbPath = process.env.BLUGBUG_IMPORT_DB ? path.resolve(process.env.BLUGBUG_IMPORT_DB) : path.join(projectDir, 'data', 'blugbug.sqlite');
const uploadsRoot = process.env.BLUGBUG_IMPORT_UPLOADS ? path.resolve(process.env.BLUGBUG_IMPORT_UPLOADS) : path.join(projectDir, 'data', 'uploads');
const reportDir = process.env.BLUGBUG_IMPORT_REPORTS ? path.resolve(process.env.BLUGBUG_IMPORT_REPORTS) : path.join(projectDir, 'data', 'import-reports');
const apply = process.argv.includes('--apply');

if (!fs.existsSync(sqlPath)) throw new Error(`Missing decompressed SQL: ${sqlPath}`);
if (!fs.existsSync(storageRoot)) throw new Error(`Missing extracted Storage archive: ${storageRoot}`);

const sql = fs.readFileSync(sqlPath, 'utf8');

function pgUnescape(value) {
  if (value === String.raw`\N`) return null;
  return value.replace(/\\([btnrfv\\])/g, (_, char) => ({ b: '\b', t: '\t', n: '\n', r: '\r', f: '\f', v: '\v', '\\': '\\' })[char] ?? char);
}

function copyRows(schema, table) {
  const re = new RegExp(`COPY ${schema}\\.${table} \\(([^)]+)\\) FROM stdin;\\r?\\n([\\s\\S]*?)\\r?\\n\\\\\\.`, 'm');
  const match = sql.match(re);
  if (!match) return [];
  const columns = match[1].split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
  return match[2].split(/\r?\n/).filter(Boolean).map((line) => {
    const values = line.split('\t').map(pgUnescape);
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? null]));
  });
}

function pgArray(value) {
  if (!value || value === '{}') return [];
  const body = value.startsWith('{') && value.endsWith('}') ? value.slice(1, -1) : value;
  const result = [];
  let token = '', quoted = false, escaped = false;
  for (const char of body) {
    if (escaped) { token += char; escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { result.push(token); token = ''; continue; }
    token += char;
  }
  if (token.length || body.endsWith(',')) result.push(token);
  return result.filter((item) => item && item !== 'NULL');
}

function safeJson(value, fallback = null) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function slug(value, fallback) {
  const normalized = String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 46);
  return normalized || fallback;
}

function unique(base, used, suffix) {
  let candidate = base;
  let counter = 1;
  while (used.has(candidate.toLowerCase())) candidate = `${base.slice(0, 38)}-${suffix || counter++}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

function bool(value) { return value === true || value === 'true' || value === 't' || value === '1'; }
function timestamp(row) {
  const combined = row.created_at || (row.date ? `${row.date} ${row.time || '00:00:00'}` : null);
  if (!combined) return new Date().toISOString();
  const parsed = new Date(String(combined).replace(' ', 'T') + (String(combined).includes('Z') ? '' : 'Z'));
  return Number.isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString();
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function newest(files) {
  return [...files].sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
}

function copyAsset(source, relativeDestination, copied) {
  if (!source) return null;
  const destination = path.join(uploadsRoot, relativeDestination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (!fs.existsSync(destination) || crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex') !== crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')) {
    fs.copyFileSync(source, destination);
    copied.push(destination);
  }
  return '/uploads/' + relativeDestination.split(path.sep).join('/');
}

const oldUsers = copyRows('public', 'users');
const oldPosts = copyRows('public', 'blog_post');
const oldNotifications = copyRows('public', 'notifications');
const oldReplies = copyRows('public', 'reply_table');
const oldSupport = copyRows('public', 'support_table');
const storageFiles = walk(storageRoot);
const bucketFiles = (bucket, ownerId) => storageFiles.filter((file) => {
  const normalized = file.split(path.sep).join('/');
  return normalized.includes(`/${bucket}/${ownerId}/`);
});

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 10000');

const report = {
  source: { users: oldUsers.length, posts: oldPosts.length, notifications: oldNotifications.length, replies: oldReplies.length, support: oldSupport.length, storageObjects: storageFiles.length },
  inserted: { users: 0, posts: 0, follows: 0, likes: 0, bookmarks: 0, comments: 0, replies: 0, notifications: 0, supportCases: 0, supportMessages: 0 },
  mappedUsers: 0, copiedAssets: 0, skipped: [], warnings: [], apply,
};

const existingUsers = db.prepare('SELECT id, username, email, chatter_name FROM users').all();
const usedUsernames = new Set(existingUsers.map((row) => row.username.toLowerCase()));
const usedChatters = new Set(existingUsers.map((row) => row.chatter_name.toLowerCase()));
const byEmail = new Map(existingUsers.map((row) => [row.email.toLowerCase(), row.id]));
const byChatter = new Map(existingUsers.map((row) => [row.chatter_name.toLowerCase(), row.id]));
const userMap = new Map();
const preparedUsers = [];

for (const row of oldUsers) {
  const email = String(row.email || '').trim().toLowerCase();
  const chatterOriginal = String(row.chatter_name || row.full_name || '').trim();
  const mapped = (email && byEmail.get(email)) || (chatterOriginal && byChatter.get(chatterOriginal.toLowerCase()));
  if (mapped) {
    userMap.set(row.id, mapped);
    report.mappedUsers += 1;
    continue;
  }
  const id = row.id;
  const suffix = row.id.slice(0, 8);
  const username = unique(slug(chatterOriginal, `legacy-${suffix}`), usedUsernames, suffix);
  const chatter = unique(chatterOriginal || username, usedChatters, suffix);
  const safeEmail = email || `${suffix}@legacy.blugbug.local`;
  preparedUsers.push({
    id, username, email: safeEmail, fullName: row.full_name || chatter, chatter,
    about: row.about_me || '', interest: row.interest_id || '',
  });
  userMap.set(row.id, id);
}

const chatterMap = new Map();
for (const row of oldUsers) {
  const mappedId = userMap.get(row.id);
  for (const value of [row.chatter_name, row.full_name, row.email]) {
    const key = String(value || '').trim().toLowerCase();
    if (key && mappedId) chatterMap.set(key, mappedId);
  }
}

const postMap = new Map(oldPosts.map((row) => [row.blog_id, row.blog_id]));
const copied = [];

const importTransaction = db.transaction(() => {
  const insertUser = db.prepare(`INSERT OR IGNORE INTO users
    (id, username, email, full_name, chatter_name, about_me, role, profile_image_url, header_image_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?, ?, ?)`);
  for (const user of preparedUsers) {
    const profileSource = newest(bucketFiles('profile-images', user.id));
    const headerSource = newest(bucketFiles('profile-header', user.id));
    const profileExt = profileSource ? path.extname(profileSource).toLowerCase() : '';
    const headerExt = headerSource ? path.extname(headerSource).toLowerCase() : '';
    const profileUrl = profileSource ? `/uploads/users/${user.id}/legacy-profile${profileExt}` : '/Default_pfp.svg';
    const headerUrl = headerSource ? `/uploads/users/${user.id}/legacy-header${headerExt}` : '/Default_Header.svg';
    const result = insertUser.run(user.id, user.username, user.email, user.fullName, user.chatter, user.about, profileUrl, headerUrl, new Date().toISOString(), new Date().toISOString());
    report.inserted.users += result.changes;
  }

  const insertPost = db.prepare(`INSERT OR IGNORE INTO posts
    (id, user_id, title, content, categories, status, created_at, updated_at, header_image_url)
    VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?)`);
  for (const row of oldPosts) {
    const userId = userMap.get(row.user_id);
    if (!userId) { report.skipped.push({ type: 'post', id: row.blog_id, reason: 'missing author' }); continue; }
    const files = bucketFiles('blog-post', row.user_id).filter((file) => file.split(path.sep).includes(row.blog_id));
    const htmlSource = files.find((file) => path.basename(file).toLowerCase() === `${row.blog_id}.html`);
    const coverSource = files.find((file) => path.basename(file).toLowerCase() === 'header-image.webp');
    let content = htmlSource ? fs.readFileSync(htmlSource, 'utf8') : '';
    content = sanitizeHtml(content, {
      allowedTags: ['p','br','strong','em','b','i','u','s','ul','ol','li','blockquote','h2','h3','h4','a','code','pre'],
      allowedAttributes: { a: ['href','title','target','rel'] }, allowedSchemes: ['http','https','mailto'],
    });
    if (!content.trim()) content = '<p>This blug was recovered from the old Blugbug database, but its original body file was unavailable.</p>';
    const coverUrl = coverSource ? `/uploads/posts/${row.blog_id}/legacy-cover.webp` : null;
    const createdAt = timestamp(row);
    const result = insertPost.run(row.blog_id, userId, row.title || 'Recovered blug', content, row.categories || '', createdAt, createdAt, coverUrl);
    report.inserted.posts += result.changes;
  }

  const insertFollow = db.prepare('INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at) VALUES (?, ?, ?)');
  for (const row of oldUsers) {
    const follower = userMap.get(row.id);
    for (const targetOld of pgArray(row.following_id)) {
      const followed = userMap.get(targetOld);
      if (!follower || !followed || follower === followed) continue;
      report.inserted.follows += insertFollow.run(follower, followed, new Date().toISOString()).changes;
    }
  }

  const insertLike = db.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)');
  const insertBookmark = db.prepare('INSERT OR IGNORE INTO bookmarks (post_id, user_id, created_at) VALUES (?, ?, ?)');
  const insertComment = db.prepare('INSERT OR IGNORE INTO comments (id, post_id, user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const commentLookup = new Map();
  const normalizeComment = (value) => sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
  for (const row of oldPosts) {
    if (!postMap.has(row.blog_id)) continue;
    for (const oldUserId of pgArray(row.liked_by)) {
      const userId = userMap.get(oldUserId); if (userId) report.inserted.likes += insertLike.run(row.blog_id, userId, timestamp(row)).changes;
    }
    for (const oldUserId of pgArray(row.bookmarked_by)) {
      const userId = userMap.get(oldUserId); if (userId) report.inserted.bookmarks += insertBookmark.run(row.blog_id, userId, timestamp(row)).changes;
    }
    const details = safeJson(row.comment_details, []);
    const comments = Array.isArray(details) ? details : details && typeof details === 'object' ? Object.values(details) : [];
    const commenterNames = pgArray(row.commented_by);
    comments.forEach((comment, index) => {
      if (!comment || typeof comment !== 'object') return;
      const oldAuthor = comment.user_id || comment.userId || comment.owner_id || comment.id;
      const metaName = String(comment.meta || '').match(/was commented by (.+?) on /i)?.[1]?.trim();
      const chatterName = String(commenterNames[index] || metaName || '').trim().toLowerCase();
      const authorId = userMap.get(oldAuthor) || chatterMap.get(chatterName) || userMap.get(row.user_id);
      const body = normalizeComment(comment.comment_main || comment.comment || comment.body || comment.text);
      if (!authorId || !body) return;
      const id = comment.comment_id || comment.commentId || `legacy-comment-${row.blog_id}-${index + 1}`;
      const createdAt = comment.created_at ? timestamp({ created_at: comment.created_at }) : timestamp(row);
      report.inserted.comments += insertComment.run(id, row.blog_id, authorId, String(body), createdAt, createdAt).changes;
      const exactKey = `${authorId}|${body.toLowerCase()}`;
      if (!commentLookup.has(exactKey)) commentLookup.set(exactKey, id);
      const bodyKey = `*|${body.toLowerCase()}`;
      if (!commentLookup.has(bodyKey)) commentLookup.set(bodyKey, id);
    });
  }

  const insertReply = db.prepare('INSERT OR IGNORE INTO comment_replies (id, comment_id, user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (const row of oldReplies) {
    const originalCommenter = userMap.get(row.comment_id);
    const normalizedParent = normalizeComment(row.comment_main);
    const parentId = commentLookup.get(`${originalCommenter}|${normalizedParent.toLowerCase()}`) || commentLookup.get(`*|${normalizedParent.toLowerCase()}`);
    if (!parentId) { report.skipped.push({ type: 'reply', id: row.serial_number, reason: 'missing parent comment' }); continue; }
    const userId = userMap.get(row.user_id) || userMap.get(row.owner_id);
    if (!userId || !row.reply_text) continue;
    const createdAt = timestamp(row);
    const replyBody = normalizeComment(row.reply_text);
    if (!replyBody) continue;
    report.inserted.replies += insertReply.run(`legacy-reply-${row.serial_number}`, parentId, userId, replyBody, createdAt, createdAt).changes;
  }

  const insertNotification = db.prepare(`INSERT OR IGNORE INTO notifications
    (id, user_id, actor_id, type, message, post_id, read, created_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`);
  for (const row of oldNotifications) {
    const userId = userMap.get(row.user_id); if (!userId) continue;
    const postId = row.blog_id && postMap.has(row.blog_id) ? row.blog_id : null;
    const rawType = String(row.not_identifier || '').toLowerCase();
    const type = rawType.includes('comment') ? 'comment' : rawType.includes('like') ? 'like' : rawType.includes('follow') ? 'follow' : 'legacy';
    report.inserted.notifications += insertNotification.run(`legacy-notification-${row.id}`, userId, type, row.message || row.blog_title || 'Recovered activity', postId, bool(row.read) ? 1 : 0, timestamp(row)).changes;
  }

  const insertCase = db.prepare('INSERT OR IGNORE INTO support_cases (id, user_id, subject, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMessage = db.prepare('INSERT OR IGNORE INTO support_messages (id, case_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)');
  for (const row of oldSupport) {
    const normalizedName = String(row.name || '').toLowerCase();
    const owner = [...userMap.entries()].find(([oldId, newId]) => {
      const user = oldUsers.find((item) => item.id === oldId);
      return user && [user.full_name, user.chatter_name, user.email].some((value) => String(value || '').toLowerCase() === normalizedName);
    })?.[1] || 'local-admin';
    const caseId = row.id || row.case_id || crypto.randomUUID();
    const times = [...pgArray(row.complain_order), ...pgArray(row.support_order)].sort();
    const createdAt = times[0] ? timestamp({ created_at: times[0] }) : new Date().toISOString();
    const status = bool(row.is_open) ? 'open' : 'resolved';
    report.inserted.supportCases += insertCase.run(caseId, owner, row.case_id ? `Legacy support case ${row.case_id}` : 'Recovered support case', status, createdAt, createdAt).changes;
    const userMessages = pgArray(row.complain_messages); if (row.complain_message) userMessages.unshift(row.complain_message);
    const staffMessages = pgArray(row.support_messages); if (row.support_message) staffMessages.unshift(row.support_message);
    userMessages.filter(Boolean).forEach((body, index) => { report.inserted.supportMessages += insertMessage.run(`legacy-support-user-${caseId}-${index}`, caseId, owner, body, createdAt).changes; });
    staffMessages.filter(Boolean).forEach((body, index) => { report.inserted.supportMessages += insertMessage.run(`legacy-support-admin-${caseId}-${index}`, caseId, 'local-admin', body, createdAt).changes; });
  }
});

if (apply) {
  importTransaction();
  for (const user of preparedUsers) {
    const profileSource = newest(bucketFiles('profile-images', user.id));
    const headerSource = newest(bucketFiles('profile-header', user.id));
    if (profileSource) copyAsset(profileSource, path.join('users', user.id, `legacy-profile${path.extname(profileSource).toLowerCase()}`), copied);
    if (headerSource) copyAsset(headerSource, path.join('users', user.id, `legacy-header${path.extname(headerSource).toLowerCase()}`), copied);
  }
  for (const row of oldPosts) {
    const files = bucketFiles('blog-post', row.user_id).filter((file) => file.split(path.sep).includes(row.blog_id));
    const coverSource = files.find((file) => path.basename(file).toLowerCase() === 'header-image.webp');
    if (coverSource) copyAsset(coverSource, path.join('posts', row.blog_id, 'legacy-cover.webp'), copied);
  }
  report.copiedAssets = copied.length;
  report.integrity = db.pragma('integrity_check', { simple: true });
  report.foreignKeyViolations = db.pragma('foreign_key_check').length;
}

fs.mkdirSync(reportDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportPath = path.join(reportDir, `old-supabase-${apply ? 'import' : 'dry-run'}-${stamp}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
db.close();
console.log(JSON.stringify({ reportPath, ...report }, null, 2));

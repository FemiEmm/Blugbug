import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, uploadsDir } from './db.js';
import { installFeatureRoutes } from './feature-routes.js';
import { renderPostPreview } from './social-preview.js';
import { sanitizePostHtml } from './content.js';

const app = express();
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = process.env.LOCAL_HOST || '127.0.0.1';
const port = Number(process.env.LOCAL_API_PORT || 3001);
const loginUsername = process.env.LOCAL_LOGIN_USERNAME || 'admin';
const loginPassword = process.env.LOCAL_LOGIN_PASSWORD || 'blugbug-local';
const sessionCookie = 'blugbug_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir, { fallthrough: false, index: false }));

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const publicUser = (user) => user && ({
  id: user.id, username: user.username, email: user.email, full_name: user.full_name,
  chatter_name: user.chatter_name, about_me: user.about_me,
  profile_image_url: user.profile_image_url || '/Default_pfp.svg',
  header_image_url: user.header_image_url || '/Default_Header.svg',
  role: user.role, created_at: user.created_at, updated_at: user.updated_at,
});

const requireSession = (req, res, next) => {
  const token = req.cookies[sessionCookie];
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  const user = db.prepare(`
    SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > CURRENT_TIMESTAMP
  `).get(hashToken(token));
  if (!user) {
    res.clearCookie(sessionCookie, { path: '/' });
    return res.status(401).json({ error: 'Session expired.' });
  }
  req.user = user;
  next();
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  if (!safeEqual(username, loginUsername) || !safeEqual(password, loginPassword)) {
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get('local-admin');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP').run();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), user.id, expiresAt);
  res.cookie(sessionCookie, token, {
    httpOnly: true, sameSite: 'strict', secure: false, maxAge: sessionLifetimeMs, path: '/',
  });
  res.json({ user: publicUser(user) });
});

app.get('/api/auth/session', requireSession, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/supabase-session', async (req, res) => {
  const accessToken = String(req.body?.accessToken || '');
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';
  if (!accessToken || !supabaseUrl || !anonKey || !secretKey) return res.status(400).json({ error: 'Supabase session exchange is unavailable.' });
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` } });
  if (!authResponse.ok) return res.status(401).json({ error: 'The verified recovery session is invalid or expired.' });
  const authUser = await authResponse.json();
  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/blugbug_users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=id&limit=1`, { headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } });
  if (!profileResponse.ok) return res.status(502).json({ error: 'Could not load the recovered Blugbug profile.' });
  const [profile] = await profileResponse.json();
  const user = profile && db.prepare('SELECT * FROM users WHERE id = ?').get(profile.id);
  if (!user) return res.status(404).json({ error: 'The recovered profile is not available on this device yet.' });
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), user.id, expiresAt);
  res.cookie(sessionCookie, token, { httpOnly: true, sameSite: 'strict', secure: false, maxAge: sessionLifetimeMs, path: '/' });
  res.json({ user: publicUser(user) });
});
app.post('/api/auth/logout', requireSession, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(req.cookies[sessionCookie]));
  res.clearCookie(sessionCookie, { path: '/' });
  res.status(204).end();
});

app.get('/api/users', requireSession, (req, res) => {
  const search = String(req.query.search || '').trim();
  const users = search
    ? db.prepare('SELECT * FROM users WHERE full_name LIKE ? OR chatter_name LIKE ? ORDER BY chatter_name LIMIT 50')
        .all(`%${search}%`, `%${search}%`)
    : db.prepare('SELECT * FROM users ORDER BY chatter_name LIMIT 50').all();
  res.json({ users: users.map(publicUser) });
});
app.get('/api/users/:id', requireSession, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});
app.patch('/api/users/:id', requireSession, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  const allowed = ['full_name', 'chatter_name', 'about_me', 'profile_image_url', 'header_image_url'];
  const entries = Object.entries(req.body || {}).filter(([key]) => allowed.includes(key));
  if (!entries.length) return res.status(400).json({ error: 'No supported fields supplied.' });
  const assignments = entries.map(([key]) => `${key} = @${key}`).join(', ');
  db.prepare(`UPDATE users SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`)
    .run(Object.fromEntries([...entries, ['id', req.params.id]]));
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)) });
});

const postSelect = `SELECT posts.*, users.full_name, users.chatter_name, users.profile_image_url FROM posts JOIN users ON users.id = posts.user_id`;
app.get('/blug/:id', (req, res) => {
  const post = db.prepare(`${postSelect} WHERE posts.id = ? AND posts.status = 'published'`).get(req.params.id);
  if (!post) return res.status(404).send('Blug not found.');
  res.type('html').send(renderPostPreview({ req, post, projectDir }));
});
app.get('/api/posts', requireSession, (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : null;
  const followingFeed = req.query.feed === 'following';
  const posts = userId
    ? db.prepare(`${postSelect} WHERE posts.user_id = ? ORDER BY posts.created_at DESC`).all(userId)
    : followingFeed
      ? db.prepare(`${postSelect} WHERE posts.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?) ORDER BY posts.created_at DESC`).all(req.user.id)
      : db.prepare(`${postSelect} ORDER BY posts.created_at DESC`).all();
  res.json({ posts });
});
app.get('/api/posts/:id', requireSession, (req, res) => {
  const post = db.prepare(`${postSelect} WHERE posts.id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Blug not found.' });
  res.json({ post });
});
app.get('/api/public/posts/:id', (req, res) => {
  const post = db.prepare(`${postSelect} WHERE posts.id = ? AND posts.status = 'published'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Blug not found.' });
  res.json({ post });
});
app.post('/api/posts', requireSession, (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  const post = {
    id: crypto.randomUUID(), user_id: req.user.id, title,
    content: sanitizePostHtml(req.body?.content), categories: String(req.body?.categories || ''),
    status: req.body?.status === 'draft' ? 'draft' : 'published',
  };
  db.prepare('INSERT INTO posts (id, user_id, title, content, categories, status) VALUES (@id, @user_id, @title, @content, @categories, @status)').run(post);
  res.status(201).json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id) });
});
app.patch('/api/posts/:id', requireSession, (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Blug not found.' });
  if (existing.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  const next = {
    id: existing.id,
    title: req.body?.title === undefined ? existing.title : String(req.body.title).trim(),
    content: req.body?.content === undefined ? existing.content : sanitizePostHtml(req.body.content),
    categories: req.body?.categories === undefined ? existing.categories : String(req.body.categories),
    status: req.body?.status === undefined ? existing.status : req.body.status === 'draft' ? 'draft' : 'published',
  };
  if (!next.title) return res.status(400).json({ error: 'Title is required.' });
  db.prepare('UPDATE posts SET title=@title, content=@content, categories=@categories, status=@status, updated_at=CURRENT_TIMESTAMP WHERE id=@id').run(next);
  res.json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(existing.id) });
});
app.delete('/api/posts/:id', requireSession, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Blug not found.' });
  if (post.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  fs.rmSync(path.join(uploadsDir, 'posts', post.id), { recursive: true, force: true });
  res.status(204).end();
});

installFeatureRoutes(app, { db, uploadsDir, requireSession });

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Local backend error.' });
});
app.listen(port, host, () => console.log(`Blugbug local API running at http://${host}:${port}`));

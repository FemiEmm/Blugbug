import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { fileTypeFromBuffer } from 'file-type'
import { sanitizePostHtml } from './content.js'
import { cleanupImportPackage, scanImportInbox } from './import-inbox.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
})
const allowedImages = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
])

const notify = (db, { userId, actorId, type, message, postId = null }) => {
  if (!userId || userId === actorId) return
  db.prepare(
    'INSERT INTO notifications (id, user_id, actor_id, type, message, post_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), userId, actorId, type, message, postId)
}

export function installFeatureRoutes(app, { db, dataDir, uploadsDir, requireSession }) {
  const requireLoopback = (req, res, next) =>
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
      ? next()
      : res.status(403).json({ error: 'The import queue is available only on this computer.' })
  const requireAdmin = (req, res, next) =>
    req.user.role === 'admin'
      ? next()
      : res.status(403).json({ error: 'Administrator access required.' })

  app.get('/api/admin/overview', requireSession, requireAdmin, (_req, res) => {
    const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
    res.json({
      users: count('users'),
      posts: count('posts'),
      notifications: count('notifications'),
      supportCases: count('support_cases')
    })
  })
  app.get('/api/import-drafts', requireLoopback, async (_req, res, next) => {
    try {
      const scan = await scanImportInbox({ db, dataDir, uploadsDir })
      res.json({
        drafts: db.prepare('SELECT * FROM import_drafts ORDER BY created_at DESC').all(),
        scan
      })
    } catch (error) {
      next(error)
    }
  })
  app.post(
    '/api/import-drafts/:id/cover',
    requireLoopback,
    upload.single('image'),
    async (req, res, next) => {
      try {
        const draft = db.prepare('SELECT * FROM import_drafts WHERE id = ?').get(req.params.id)
        if (!draft) return res.status(404).json({ error: 'Import draft not found.' })
        if (!req.file) return res.status(400).json({ error: 'Choose an image.' })
        const detected = await fileTypeFromBuffer(req.file.buffer)
        const extension = detected && allowedImages.get(detected.mime)
        if (!extension) return res.status(415).json({ error: 'Use a JPG, PNG, WEBP or GIF image.' })
        const directory = path.join(uploadsDir, 'import-drafts', draft.id)
        fs.mkdirSync(directory, { recursive: true })
        const filename = `cover-${crypto.randomUUID()}.${extension}`
        fs.writeFileSync(path.join(directory, filename), req.file.buffer)
        const coverImageUrl = `/uploads/import-drafts/${draft.id}/${filename}`
        db.prepare(
          'UPDATE import_drafts SET cover_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(coverImageUrl, draft.id)
        res.json({ draft: db.prepare('SELECT * FROM import_drafts WHERE id = ?').get(draft.id) })
      } catch (error) {
        next(error)
      }
    }
  )
  app.patch('/api/import-drafts/:id', requireLoopback, (req, res) => {
    const draft = db.prepare('SELECT * FROM import_drafts WHERE id = ?').get(req.params.id)
    if (!draft) return res.status(404).json({ error: 'Import draft not found.' })
    const next = {
      id: draft.id,
      channel_id: String(req.body?.channel_id ?? draft.channel_id),
      proposed_channel_name: String(
        req.body?.proposed_channel_name ?? draft.proposed_channel_name ?? ''
      ).trim(),
      proposed_channel_handle: String(
        req.body?.proposed_channel_handle ?? draft.proposed_channel_handle ?? ''
      ).trim(),
      topic: String(req.body?.topic ?? draft.topic).trim(),
      title: String(req.body?.title ?? draft.title).trim(),
      content: req.body?.content === undefined ? draft.content : sanitizePostHtml(req.body.content),
      status: ['draft', 'ready', 'published', 'rejected'].includes(req.body?.status)
        ? req.body.status
        : draft.status,
      cover_image_url:
        req.body?.cover_image_url === undefined ? draft.cover_image_url : req.body.cover_image_url,
      published_post_id: req.body?.published_post_id ?? draft.published_post_id
    }
    if (!next.title || !next.content.replace(/<[^>]+>/g, '').trim())
      return res.status(400).json({ error: 'A title and Blug text are required.' })
    db.prepare(
      'UPDATE import_drafts SET channel_id=@channel_id, proposed_channel_name=@proposed_channel_name, proposed_channel_handle=@proposed_channel_handle, topic=@topic, title=@title, content=@content, cover_image_url=@cover_image_url, status=@status, published_post_id=@published_post_id, updated_at=CURRENT_TIMESTAMP WHERE id=@id'
    ).run(next)
    if (draft.status !== 'published' && next.status === 'published') {
      try {
        cleanupImportPackage({ dataDir, uploadsDir, draft })
      } catch (error) {
        console.error(
          `Published ${draft.id}, but its local import package could not be removed.`,
          error
        )
      }
    }
    res.json({ draft: db.prepare('SELECT * FROM import_drafts WHERE id = ?').get(draft.id) })
  })
  app.get('/api/admin/users', requireSession, requireAdmin, (_req, res) => {
    res.json({
      users: db
        .prepare(
          'SELECT id, username, email, full_name, chatter_name, about_me, profile_image_url, header_image_url, role, created_at, updated_at FROM users ORDER BY created_at DESC'
        )
        .all()
    })
  })
  const getChannel = (id) =>
    db.prepare("SELECT * FROM users WHERE id = ? AND id LIKE 'channel-%'").get(id)
  const channelPostsQuery = db.prepare(
    'SELECT posts.*, users.full_name, users.chatter_name, users.profile_image_url FROM posts JOIN users ON users.id = posts.user_id WHERE posts.user_id = ? ORDER BY posts.created_at DESC'
  )
  app.get('/api/admin/channels', requireSession, requireAdmin, (_req, res) => {
    const channels = db
      .prepare(
        "SELECT id, username, email, full_name, chatter_name, about_me, profile_image_url, header_image_url, role, created_at, updated_at, (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id) AS post_count FROM users WHERE id LIKE 'channel-%' ORDER BY full_name"
      )
      .all()
    res.json({
      channels: channels.map((channel) => ({
        ...channel,
        posts: channelPostsQuery.all(channel.id)
      }))
    })
  })
  app.patch('/api/admin/channels/:id', requireSession, requireAdmin, (req, res) => {
    const channel = getChannel(req.params.id)
    if (!channel) return res.status(404).json({ error: 'Channel not found.' })
    const fullName = String(req.body?.full_name ?? channel.full_name).trim()
    const chatterName = String(req.body?.chatter_name ?? channel.chatter_name)
      .trim()
      .toLowerCase()
    const aboutMe = String(req.body?.about_me ?? channel.about_me ?? '').trim()
    if (!fullName || fullName.length > 100)
      return res.status(400).json({ error: 'Channel name must be 1–100 characters.' })
    if (!/^[a-z0-9._-]{2,40}$/.test(chatterName))
      return res.status(400).json({
        error: 'Handle must be 2–40 lowercase letters, numbers, dots, dashes, or underscores.'
      })
    if (aboutMe.length > 500)
      return res.status(400).json({ error: 'Description must be 500 characters or fewer.' })
    try {
      db.prepare(
        'UPDATE users SET full_name = ?, chatter_name = ?, about_me = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(fullName, chatterName, aboutMe, channel.id)
    } catch (error) {
      if (String(error).includes('UNIQUE'))
        return res.status(409).json({ error: 'That channel handle is already used.' })
      throw error
    }
    res.json({ channel: getChannel(channel.id) })
  })
  app.post('/api/admin/channels/:id/posts', requireSession, requireAdmin, (req, res) => {
    const channel = getChannel(req.params.id)
    if (!channel) return res.status(404).json({ error: 'Channel not found.' })
    const title = String(req.body?.title || '').trim()
    const content = sanitizePostHtml(req.body?.content)
    const categories = String(req.body?.categories || '').trim()
    if (!title || title.length > 180)
      return res.status(400).json({ error: 'Title must be 1–180 characters.' })
    if (!content.replace(/<[^>]+>/g, '').trim())
      return res.status(400).json({ error: 'Blug text is required.' })
    const id = crypto.randomUUID()
    db.prepare(
      "INSERT INTO posts (id, user_id, title, content, categories, status) VALUES (?, ?, ?, ?, ?, 'published')"
    ).run(id, channel.id, title, content, categories)
    res.status(201).json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(id) })
  })
  app.patch(
    '/api/admin/channels/:channelId/posts/:postId',
    requireSession,
    requireAdmin,
    (req, res) => {
      if (!getChannel(req.params.channelId))
        return res.status(404).json({ error: 'Channel not found.' })
      const post = db
        .prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?')
        .get(req.params.postId, req.params.channelId)
      if (!post) return res.status(404).json({ error: 'Channel blug not found.' })
      const title = String(req.body?.title ?? post.title).trim()
      const content =
        req.body?.content === undefined ? post.content : sanitizePostHtml(req.body.content)
      const categories = String(req.body?.categories ?? post.categories).trim()
      if (!title || title.length > 180)
        return res.status(400).json({ error: 'Title must be 1–180 characters.' })
      if (!content.replace(/<[^>]+>/g, '').trim())
        return res.status(400).json({ error: 'Blug text is required.' })
      db.prepare(
        'UPDATE posts SET title = ?, content = ?, categories = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(title, content, categories, post.id)
      res.json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id) })
    }
  )
  app.get('/api/admin/posts', requireSession, requireAdmin, (_req, res) => {
    res.json({
      posts: db
        .prepare(
          'SELECT posts.*, users.chatter_name FROM posts JOIN users ON users.id = posts.user_id ORDER BY posts.created_at DESC'
        )
        .all()
    })
  })
  app.get('/api/admin/notifications', requireSession, requireAdmin, (_req, res) => {
    res.json({
      notifications: db
        .prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200')
        .all()
    })
  })
  app.delete('/api/admin/users/:id', requireSession, requireAdmin, (req, res) => {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot delete your active admin account.' })
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
    if (!result.changes) return res.status(404).json({ error: 'User not found.' })
    fs.rmSync(path.join(uploadsDir, 'users', req.params.id), { recursive: true, force: true })
    res.status(204).end()
  })
  app.delete('/api/admin/notifications/:id', requireSession, requireAdmin, (req, res) => {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id)
    res.status(204).end()
  })

  app.post('/api/uploads/images', requireSession, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image is required.' })
    const detected = await fileTypeFromBuffer(req.file.buffer)
    const extension = detected && allowedImages.get(detected.mime)
    if (!extension)
      return res.status(415).json({ error: 'Only JPG, PNG, WebP, or GIF images are allowed.' })
    const purpose = req.body.purpose === 'header' ? 'header' : 'profile'
    const postId = req.body.postId ? String(req.body.postId) : null
    const requestedUserId = req.body.userId ? String(req.body.userId) : null
    let targetUserId = req.user.id
    if (requestedUserId && requestedUserId !== req.user.id) {
      if (req.user.role !== 'admin' || !getChannel(requestedUserId))
        return res.status(403).json({ error: 'Not allowed.' })
      targetUserId = requestedUserId
    }
    if (postId) {
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId)
      if (!post || (post.user_id !== req.user.id && req.user.role !== 'admin'))
        return res.status(403).json({ error: 'Not allowed.' })
    }
    const segments = postId ? ['posts', postId] : ['users', targetUserId]
    const directory = path.join(uploadsDir, ...segments)
    fs.mkdirSync(directory, { recursive: true })
    for (const oldFile of fs
      .readdirSync(directory)
      .filter((name) => name.startsWith(`${purpose}.`) || name.startsWith(`${purpose}-`))) {
      fs.rmSync(path.join(directory, oldFile))
    }
    // A new filename prevents browsers from reusing the previous image from cache.
    const filename = `${purpose}-${Date.now()}.${extension}`
    fs.writeFileSync(path.join(directory, filename), req.file.buffer, { flag: 'wx' })
    const url = `/uploads/${segments.join('/')}/${filename}`
    if (!postId) {
      const column = purpose === 'header' ? 'header_image_url' : 'profile_image_url'
      db.prepare(`UPDATE users SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
        url,
        targetUserId
      )
    } else {
      db.prepare(
        'UPDATE posts SET header_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(url, postId)
    }
    res.status(201).json({ url })
  })

  app.get('/api/posts/:id/media', (req, res) => {
    const post = db.prepare('SELECT id, user_id, status FROM posts WHERE id = ?').get(req.params.id)
    if (!post || post.status !== 'published')
      return res.status(404).json({ error: 'Blug not found.' })
    res.json({
      media: db
        .prepare('SELECT * FROM post_media WHERE post_id = ? ORDER BY created_at')
        .all(post.id)
    })
  })
  app.post('/api/posts/:id/media', requireSession, upload.single('image'), async (req, res) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ error: 'Blug not found.' })
    if (post.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not allowed.' })
    if (!req.file) return res.status(400).json({ error: 'Image is required.' })
    const altText = String(req.body?.altText || '').trim()
    const caption = String(req.body?.caption || '').trim()
    if (!altText || altText.length > 300)
      return res.status(400).json({ error: 'Image description must be 1–300 characters.' })
    if (caption.length > 500)
      return res.status(400).json({ error: 'Caption must be 500 characters or fewer.' })
    const detected = await fileTypeFromBuffer(req.file.buffer)
    const extension = detected && allowedImages.get(detected.mime)
    if (!extension)
      return res.status(415).json({ error: 'Only JPG, PNG, WebP, or GIF images are allowed.' })
    const id = crypto.randomUUID()
    const segments = ['posts', post.id, 'media']
    const directory = path.join(uploadsDir, ...segments)
    fs.mkdirSync(directory, { recursive: true })
    const filename = `${id}.${extension}`
    const storagePath = [...segments, filename].join('/')
    const publicUrl = `/uploads/${storagePath}`
    fs.writeFileSync(path.join(directory, filename), req.file.buffer, { flag: 'wx' })
    try {
      db.prepare(
        `INSERT INTO post_media
        (id, post_id, user_id, storage_path, public_url, alt_text, caption, mime_type, byte_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        post.id,
        post.user_id,
        storagePath,
        publicUrl,
        altText,
        caption,
        detected.mime,
        req.file.size
      )
    } catch (error) {
      fs.rmSync(path.join(directory, filename), { force: true })
      throw error
    }
    res.status(201).json({ media: db.prepare('SELECT * FROM post_media WHERE id = ?').get(id) })
  })
  app.delete('/api/posts/:postId/media/:mediaId', requireSession, (req, res) => {
    const media = db
      .prepare(
        'SELECT m.*, p.user_id AS post_owner_id FROM post_media m JOIN posts p ON p.id = m.post_id WHERE m.id = ? AND m.post_id = ?'
      )
      .get(req.params.mediaId, req.params.postId)
    if (!media) return res.status(404).json({ error: 'Image not found.' })
    if (media.post_owner_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not allowed.' })
    db.prepare('DELETE FROM post_media WHERE id = ?').run(media.id)
    const absolutePath = path.resolve(uploadsDir, media.storage_path)
    if (absolutePath.startsWith(path.resolve(uploadsDir) + path.sep))
      fs.rmSync(absolutePath, { force: true })
    res.status(204).end()
  })

  app.get('/api/social/status/:userId', requireSession, (req, res) => {
    const following = Boolean(
      db
        .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?')
        .get(req.user.id, req.params.userId)
    )
    const followers = db
      .prepare('SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?')
      .get(req.params.userId).count
    const followingCount = db
      .prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?')
      .get(req.params.userId).count
    res.json({ following, followers, followingCount })
  })
  app.put('/api/social/follows/:userId', requireSession, (req, res) => {
    if (req.params.userId === req.user.id)
      return res.status(400).json({ error: 'You cannot follow yourself.' })
    const target = db
      .prepare('SELECT id, chatter_name FROM users WHERE id = ?')
      .get(req.params.userId)
    if (!target) return res.status(404).json({ error: 'User not found.' })
    const result = db
      .prepare('INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)')
      .run(req.user.id, target.id)
    if (result.changes)
      notify(db, {
        userId: target.id,
        actorId: req.user.id,
        type: 'follow',
        message: `${req.user.chatter_name} followed you.`
      })
    res.status(204).end()
  })
  app.delete('/api/social/follows/:userId', requireSession, (req, res) => {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?').run(
      req.user.id,
      req.params.userId
    )
    res.status(204).end()
  })
  app.get('/api/social/followers/:userId', requireSession, (req, res) => {
    const users = db
      .prepare(
        'SELECT users.* FROM follows JOIN users ON users.id = follows.follower_id WHERE follows.followed_id = ? ORDER BY follows.created_at DESC'
      )
      .all(req.params.userId)
    res.json({ users })
  })
  app.get('/api/social/following/:userId', requireSession, (req, res) => {
    const users = db
      .prepare(
        'SELECT users.* FROM follows JOIN users ON users.id = follows.followed_id WHERE follows.follower_id = ? ORDER BY follows.created_at DESC'
      )
      .all(req.params.userId)
    res.json({ users })
  })

  app.get('/api/posts/:id/interactions', requireSession, (req, res) => {
    const likes = db
      .prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?')
      .get(req.params.id).count
    const bookmarks = db
      .prepare('SELECT COUNT(*) AS count FROM bookmarks WHERE post_id = ?')
      .get(req.params.id).count
    const liked = Boolean(
      db
        .prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?')
        .get(req.params.id, req.user.id)
    )
    const bookmarked = Boolean(
      db
        .prepare('SELECT 1 FROM bookmarks WHERE post_id = ? AND user_id = ?')
        .get(req.params.id, req.user.id)
    )
    res.json({ likes, bookmarks, liked, bookmarked })
  })
  for (const [pathName, table, type] of [
    ['likes', 'post_likes', 'like'],
    ['bookmarks', 'bookmarks', 'bookmark']
  ]) {
    app.put(`/api/posts/:id/${pathName}`, requireSession, (req, res) => {
      const post = db
        .prepare(
          'SELECT posts.*, users.chatter_name FROM posts JOIN users ON users.id = posts.user_id WHERE posts.id = ?'
        )
        .get(req.params.id)
      if (!post) return res.status(404).json({ error: 'Blug not found.' })
      const result = db
        .prepare(`INSERT OR IGNORE INTO ${table} (post_id, user_id) VALUES (?, ?)`)
        .run(post.id, req.user.id)
      if (result.changes)
        notify(db, {
          userId: post.user_id,
          actorId: req.user.id,
          type,
          message: `${req.user.chatter_name} ${type}d your blug.`,
          postId: post.id
        })
      res.status(204).end()
    })
    app.delete(`/api/posts/:id/${pathName}`, requireSession, (req, res) => {
      db.prepare(`DELETE FROM ${table} WHERE post_id = ? AND user_id = ?`).run(
        req.params.id,
        req.user.id
      )
      res.status(204).end()
    })
  }

  app.get('/api/posts/:id/comments', requireSession, (req, res) => {
    const comments = db
      .prepare(
        `SELECT comments.*, users.chatter_name FROM comments JOIN users ON users.id = comments.user_id WHERE post_id = ? ORDER BY comments.created_at`
      )
      .all(req.params.id)
    const replyQuery = db.prepare(
      `SELECT comment_replies.*, users.chatter_name FROM comment_replies JOIN users ON users.id = comment_replies.user_id WHERE comment_id = ? ORDER BY comment_replies.created_at`
    )
    res.json({
      comments: comments.map((comment) => ({ ...comment, replies: replyQuery.all(comment.id) }))
    })
  })
  app.post('/api/posts/:id/comments', requireSession, (req, res) => {
    const body = String(req.body?.body || '').trim()
    if (!body || body.length > 2000)
      return res.status(400).json({ error: 'Comment must be 1–2000 characters.' })
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ error: 'Blug not found.' })
    const id = crypto.randomUUID()
    db.prepare('INSERT INTO comments (id, post_id, user_id, body) VALUES (?, ?, ?, ?)').run(
      id,
      post.id,
      req.user.id,
      body
    )
    notify(db, {
      userId: post.user_id,
      actorId: req.user.id,
      type: 'comment',
      message: `${req.user.chatter_name} commented on your blug.`,
      postId: post.id
    })
    res.status(201).json({ comment: db.prepare('SELECT * FROM comments WHERE id = ?').get(id) })
  })
  app.delete('/api/comments/:id', requireSession, (req, res) => {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found.' })
    if (comment.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not allowed.' })
    db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id)
    res.status(204).end()
  })
  app.post('/api/comments/:id/replies', requireSession, (req, res) => {
    const body = String(req.body?.body || '').trim()
    if (!body || body.length > 2000)
      return res.status(400).json({ error: 'Reply must be 1–2000 characters.' })
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found.' })
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO comment_replies (id, comment_id, user_id, body) VALUES (?, ?, ?, ?)'
    ).run(id, comment.id, req.user.id, body)
    notify(db, {
      userId: comment.user_id,
      actorId: req.user.id,
      type: 'reply',
      message: `${req.user.chatter_name} replied to your comment.`,
      postId: comment.post_id
    })
    res
      .status(201)
      .json({ reply: db.prepare('SELECT * FROM comment_replies WHERE id = ?').get(id) })
  })

  const paragraphQuestionQuery = `SELECT q.*, u.full_name, u.chatter_name, u.profile_image_url
    FROM paragraph_questions q JOIN users u ON u.id = q.user_id`
  app.get('/api/posts/:id/paragraph-questions', (req, res) => {
    const questions = db
      .prepare(
        `${paragraphQuestionQuery} WHERE q.post_id = ? ORDER BY q.paragraph_index, q.created_at`
      )
      .all(req.params.id)
    res.json({ questions })
  })
  app.post('/api/posts/:id/paragraph-questions', requireSession, (req, res) => {
    const paragraphIndex = Number(req.body?.paragraphIndex)
    const body = String(req.body?.body || '').trim()
    if (!Number.isInteger(paragraphIndex) || paragraphIndex < 0)
      return res.status(400).json({ error: 'Choose a valid paragraph.' })
    if (!body || body.length > 1000)
      return res.status(400).json({ error: 'Question must be 1–1000 characters.' })
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ error: 'Blug not found.' })
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO paragraph_questions (id, post_id, paragraph_index, user_id, body) VALUES (?, ?, ?, ?, ?)'
    ).run(id, post.id, paragraphIndex, req.user.id, body)
    notify(db, {
      userId: post.user_id,
      actorId: req.user.id,
      type: 'paragraph_question',
      message: `${req.user.chatter_name} questioned a paragraph in your blug.`,
      postId: post.id
    })
    res
      .status(201)
      .json({ question: db.prepare(`${paragraphQuestionQuery} WHERE q.id = ?`).get(id) })
  })
  app.patch('/api/paragraph-questions/:id/answer', requireSession, (req, res) => {
    const body = String(req.body?.body || '').trim()
    if (!body || body.length > 2000)
      return res.status(400).json({ error: 'Answer must be 1–2000 characters.' })
    const question = db
      .prepare(
        'SELECT q.*, p.user_id AS author_id FROM paragraph_questions q JOIN posts p ON p.id = q.post_id WHERE q.id = ?'
      )
      .get(req.params.id)
    if (!question) return res.status(404).json({ error: 'Paragraph question not found.' })
    if (question.author_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Only the blug author can answer this question.' })
    db.prepare(
      'UPDATE paragraph_questions SET author_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(body, question.id)
    notify(db, {
      userId: question.user_id,
      actorId: req.user.id,
      type: 'paragraph_answer',
      message: `${req.user.chatter_name} answered your paragraph question.`,
      postId: question.post_id
    })
    res.json({ question: db.prepare(`${paragraphQuestionQuery} WHERE q.id = ?`).get(question.id) })
  })

  app.get('/api/notifications', requireSession, (req, res) => {
    const notifications = db
      .prepare(
        `SELECT n.*, u.full_name AS actor_name, u.chatter_name AS actor_handle, u.profile_image_url AS actor_image FROM notifications n LEFT JOIN users u ON u.id = n.actor_id WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 100`
      )
      .all(req.user.id)
    res.json({ notifications })
  })
  app.patch('/api/notifications/:id/read', requireSession, (req, res) => {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.user.id
    )
    res.status(204).end()
  })
  app.post('/api/notifications/read-all', requireSession, (req, res) => {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id)
    res.status(204).end()
  })

  app.get('/api/support/cases', requireSession, (req, res) => {
    const cases =
      req.user.role === 'admin'
        ? db.prepare('SELECT * FROM support_cases ORDER BY updated_at DESC').all()
        : db
            .prepare('SELECT * FROM support_cases WHERE user_id = ? ORDER BY updated_at DESC')
            .all(req.user.id)
    res.json({ cases })
  })
  app.post('/api/support/cases', requireSession, (req, res) => {
    const subject = String(req.body?.subject || '').trim()
    const body = String(req.body?.body || '').trim()
    if (!subject || !body)
      return res.status(400).json({ error: 'Subject and message are required.' })
    const caseId = crypto.randomUUID()
    db.transaction(() => {
      db.prepare('INSERT INTO support_cases (id, user_id, subject) VALUES (?, ?, ?)').run(
        caseId,
        req.user.id,
        subject
      )
      db.prepare(
        'INSERT INTO support_messages (id, case_id, user_id, body) VALUES (?, ?, ?, ?)'
      ).run(crypto.randomUUID(), caseId, req.user.id, body)
    })()
    res
      .status(201)
      .json({ case: db.prepare('SELECT * FROM support_cases WHERE id = ?').get(caseId) })
  })
  const getCaseForUser = (caseId, user) => {
    const supportCase = db.prepare('SELECT * FROM support_cases WHERE id = ?').get(caseId)
    return supportCase && (supportCase.user_id === user.id || user.role === 'admin')
      ? supportCase
      : null
  }
  app.get('/api/support/cases/:id/messages', requireSession, (req, res) => {
    if (!getCaseForUser(req.params.id, req.user))
      return res.status(404).json({ error: 'Case not found.' })
    const messages = db
      .prepare(
        `SELECT support_messages.*, users.chatter_name, users.role FROM support_messages JOIN users ON users.id = support_messages.user_id WHERE case_id = ? ORDER BY support_messages.created_at`
      )
      .all(req.params.id)
    res.json({ messages })
  })
  app.post('/api/support/cases/:id/messages', requireSession, (req, res) => {
    const supportCase = getCaseForUser(req.params.id, req.user)
    const body = String(req.body?.body || '').trim()
    if (!supportCase) return res.status(404).json({ error: 'Case not found.' })
    if (!body) return res.status(400).json({ error: 'Message is required.' })
    db.prepare('INSERT INTO support_messages (id, case_id, user_id, body) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(),
      supportCase.id,
      req.user.id,
      body
    )
    db.prepare('UPDATE support_cases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      supportCase.id
    )
    res.status(201).json({ ok: true })
  })
  app.patch('/api/support/cases/:id/status', requireSession, (req, res) => {
    const supportCase = getCaseForUser(req.params.id, req.user)
    const status = ['open', 'resolved', 'closed'].includes(req.body?.status)
      ? req.body.status
      : null
    if (!supportCase) return res.status(404).json({ error: 'Case not found.' })
    if (!status) return res.status(400).json({ error: 'Invalid status.' })
    db.prepare(
      'UPDATE support_cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, supportCase.id)
    res.status(204).end()
  })
}

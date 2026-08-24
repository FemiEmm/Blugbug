import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { sanitizePostHtml } from './content.js'

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const safeText = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback)
const escapeHtml = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]
  )

function markdownToHtml(markdown) {
  return markdown
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const value = block.trim()
      if (!value) return ''
      const heading = value.match(/^(#{1,3})\s+([\s\S]+)$/)
      if (heading) return `<h${heading[1].length}>${escapeHtml(heading[2])}</h${heading[1].length}>`
      return `<p>${escapeHtml(value).replace(/\r?\n/g, '<br>')}</p>`
    })
    .join('')
}

const packageId = (sourceUrl, folderName) =>
  `import-${crypto
    .createHash('sha256')
    .update(sourceUrl || folderName)
    .digest('hex')
    .slice(0, 16)}`
const channelHandle = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
    .slice(0, 40) || 'new.channel'

export async function scanImportInbox({ db, dataDir, uploadsDir }) {
  const inboxDir = path.join(dataDir, 'import-inbox')
  fs.mkdirSync(inboxDir, { recursive: true })
  const imported = []
  const errors = []

  for (const entry of fs.readdirSync(inboxDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const packageDir = path.join(inboxDir, entry.name)
    const manifestPath = path.join(packageDir, 'manifest.json')
    if (!fs.existsSync(manifestPath)) continue
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      const sourceUrl = safeText(manifest.source_url, `local-package:${entry.name}`)
      const id = packageId(sourceUrl, entry.name)
      const title = safeText(manifest.title)
      const topic = safeText(manifest.topic, 'General')
      const requestedChannel = safeText(manifest.channel_id || manifest.channel)
      const channel = db
        .prepare(
          "SELECT id FROM users WHERE id LIKE 'channel-%' AND (id = ? OR lower(full_name) = lower(?) OR lower(chatter_name) = lower(?)) LIMIT 1"
        )
        .get(requestedChannel, requestedChannel, requestedChannel.replace(/^@/, ''))
      if (!title) throw new Error('manifest.json needs a title.')
      if (!requestedChannel) throw new Error('manifest.json needs a channel name.')
      const proposedName = channel ? '' : requestedChannel
      const proposedHandle = channel ? '' : channelHandle(requestedChannel)
      const targetChannelId = channel
        ? channel.id
        : `channel-${proposedHandle.replace(/\./g, '-').slice(0, 48)}`

      const htmlPath = path.join(packageDir, 'content.html')
      const markdownPath = path.join(packageDir, 'content.md')
      const content = fs.existsSync(htmlPath)
        ? fs.readFileSync(htmlPath, 'utf8')
        : fs.existsSync(markdownPath)
          ? markdownToHtml(fs.readFileSync(markdownPath, 'utf8'))
          : safeText(manifest.content_html)
      const cleanContent = sanitizePostHtml(content)
      if (!cleanContent.replace(/<[^>]+>/g, '').trim())
        throw new Error('Add content.html or content.md with the Blug text.')

      let coverImageUrl = null
      const coverName = safeText(manifest.cover)
      if (coverName) {
        const coverPath = path.resolve(packageDir, coverName)
        if (!coverPath.startsWith(`${path.resolve(packageDir)}${path.sep}`))
          throw new Error('The cover path must remain inside its package folder.')
        const extension = path.extname(coverPath).toLowerCase()
        if (!imageExtensions.has(extension)) throw new Error('Cover must be JPG, PNG, WEBP or GIF.')
        if (!fs.existsSync(coverPath)) throw new Error(`Cover file not found: ${coverName}.`)
        if (fs.statSync(coverPath).size > 5 * 1024 * 1024)
          throw new Error('Cover is larger than 5 MB.')
        const destinationDir = path.join(uploadsDir, 'import-drafts', id)
        fs.mkdirSync(destinationDir, { recursive: true })
        const destination = path.join(
          destinationDir,
          `cover${extension === '.jpeg' ? '.jpg' : extension}`
        )
        fs.copyFileSync(coverPath, destination)
        coverImageUrl = `/uploads/import-drafts/${id}/${path.basename(destination)}`
      }

      const existing = db
        .prepare('SELECT id, status FROM import_drafts WHERE source_url = ?')
        .get(sourceUrl)
      if (!existing) {
        db.prepare(
          `INSERT INTO import_drafts
           (id, source_url, source_title, channel_id, proposed_channel_name,
            proposed_channel_handle, topic, title, content, cover_image_url, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready')`
        ).run(
          id,
          sourceUrl,
          safeText(manifest.source_title),
          targetChannelId,
          proposedName,
          proposedHandle,
          topic,
          title,
          cleanContent,
          coverImageUrl
        )
        imported.push(id)
      }
    } catch (error) {
      errors.push({
        package: entry.name,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
  return { imported, errors, inboxDir }
}

export function cleanupImportPackage({ dataDir, uploadsDir, draft }) {
  const inboxDir = path.resolve(dataDir, 'import-inbox')
  if (fs.existsSync(inboxDir)) {
    for (const entry of fs.readdirSync(inboxDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const packageDir = path.resolve(inboxDir, entry.name)
      const manifestPath = path.join(packageDir, 'manifest.json')
      if (!packageDir.startsWith(`${inboxDir}${path.sep}`) || !fs.existsSync(manifestPath)) continue
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const sourceUrl = safeText(manifest.source_url, `local-package:${entry.name}`)
        if (sourceUrl === draft.source_url) fs.rmSync(packageDir, { recursive: true, force: true })
      } catch {
        // Invalid packages remain available for the administrator to repair.
      }
    }
  }
  const temporaryCoverDir = path.resolve(uploadsDir, 'import-drafts', draft.id)
  const allowedRoot = path.resolve(uploadsDir, 'import-drafts')
  if (temporaryCoverDir.startsWith(`${allowedRoot}${path.sep}`))
    fs.rmSync(temporaryCoverDir, { recursive: true, force: true })
}

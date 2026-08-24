import fs from 'node:fs'
import path from 'node:path'

const escapeAttribute = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const plainText = (html = '') =>
  String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const safeOrigin = (req) => {
  const configured = String(process.env.PUBLIC_APP_URL || '')
    .trim()
    .replace(/\/$/, '')
  if (/^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(configured)) return configured
  const host = String(req.get('host') || '127.0.0.1').replace(/[^a-z0-9.:[\]-]/gi, '')
  return `${req.secure ? 'https' : 'http'}://${host}`
}

export function renderPostPreview({ req, post, projectDir }) {
  const builtIndex = path.join(projectDir, 'dist', 'index.html')
  const sourceIndex = path.join(projectDir, 'index.html')
  const template = fs.readFileSync(fs.existsSync(builtIndex) ? builtIndex : sourceIndex, 'utf8')
  const origin = safeOrigin(req)
  const url = `${origin}/blug/${encodeURIComponent(post.id)}`
  const descriptionText = plainText(post.content)
  const excerpt =
    descriptionText.length > 150 ? `${descriptionText.slice(0, 147)}…` : descriptionText
  const description = `Read this Blug on Blugbug${excerpt ? ` — ${excerpt}` : '.'}`
  const fallback =
    [...post.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 2
      ? '/blug_default.png'
      : '/blug_default_2.webp'
  const imagePath = post.header_image_url || fallback
  const image = /^https?:\/\//i.test(imagePath)
    ? imagePath
    : `${origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
  const title = `${post.title} — Blugbug`
  const author = post.full_name || post.chatter_name || 'Blugbug'
  const metadata = `
    <title>${escapeAttribute(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}">
    <link rel="canonical" href="${escapeAttribute(url)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Blugbug">
    <meta property="og:title" content="${escapeAttribute(post.title)}">
    <meta property="og:description" content="${escapeAttribute(description)}">
    <meta property="og:url" content="${escapeAttribute(url)}">
    <meta property="og:image" content="${escapeAttribute(image)}">
    <meta property="og:image:alt" content="Blugbug link preview for ${escapeAttribute(post.title)}">
    <meta property="article:author" content="${escapeAttribute(author)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeAttribute(post.title)} — Blugbug">
    <meta name="twitter:description" content="${escapeAttribute(description)}">
    <meta name="twitter:image" content="${escapeAttribute(image)}">
    <meta name="twitter:image:alt" content="Blugbug link preview for ${escapeAttribute(post.title)}">
  `
  return template.replace(/<title>.*?<\/title>/is, '').replace('</head>', `${metadata}</head>`)
}

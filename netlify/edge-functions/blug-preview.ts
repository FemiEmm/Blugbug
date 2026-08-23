declare const Netlify: { env: { get(name: string): string | undefined } };

const crawler = /facebookexternalhit|facebot|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|googlebot|bingbot|pinterest/i;
const escapeHtml = (value = '') => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
const plainText = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export default async (request: Request, context: { next(): Promise<Response> }) => {
  if (!crawler.test(request.headers.get('user-agent') || '')) return context.next();

  const requestUrl = new URL(request.url);
  const id = decodeURIComponent(requestUrl.pathname.split('/').filter(Boolean).at(-1) || '');
  const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL');
  const anonKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
  if (!id || !supabaseUrl || !anonKey) return context.next();

  const query = new URL('/rest/v1/blugbug_posts', supabaseUrl);
  query.searchParams.set('select', 'id,title,excerpt,content_html,cover_image_url,blugbug_users!blugbug_posts_user_id_fkey(full_name,chatter_name)');
  query.searchParams.set('id', `eq.${id}`);
  query.searchParams.set('status', 'eq.published');
  query.searchParams.set('limit', '1');

  try {
    const response = await fetch(query, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
    if (!response.ok) return context.next();
    const [post] = await response.json();
    if (!post) return context.next();

    const author = post.blugbug_users?.full_name || post.blugbug_users?.chatter_name || 'Blugbug';
    const description = (plainText(post.excerpt || post.content_html).slice(0, 220) || `Read ${post.title} by ${author} on Blugbug.`).trim();
    const image = new URL(post.cover_image_url || '/blug_default.png', requestUrl.origin).href;
    const canonical = `${requestUrl.origin}/blug/${encodeURIComponent(post.id)}`;
    const title = `${post.title} — Blugbug`;

    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Blugbug"><meta property="og:title" content="${escapeHtml(post.title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:alt" content="Cover image for ${escapeHtml(post.title)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(post.title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"></head><body><h1>${escapeHtml(post.title)}</h1><p>By ${escapeHtml(author)}</p><p>${escapeHtml(description)}</p><a href="${escapeHtml(canonical)}">Read this blug on Blugbug</a></body></html>`, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' },
    });
  } catch {
    return context.next();
  }
};

export const config = { path: '/blug/:id', method: 'GET' };

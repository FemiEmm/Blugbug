import sanitizeHtml from 'sanitize-html';

const allowedTags = [...sanitizeHtml.defaults.allowedTags, 'figure', 'figcaption', 'img'];
const allowedAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  figure: ['data-media-id'],
  img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
};

const trustedInlineImage = (src = '') => {
  if (src.startsWith('/uploads/posts/')) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:'
      && url.pathname.includes('/storage/v1/object/public/blugbug_post_media/');
  } catch {
    return false;
  }
};

export const sanitizePostHtml = (value) => sanitizeHtml(String(value || ''), {
  allowedTags,
  allowedAttributes,
  allowedSchemes: ['https'],
  exclusiveFilter(frame) {
    return frame.tag === 'img' && !trustedInlineImage(frame.attribs?.src);
  },
  transformTags: {
    img: (_tagName, attribs) => ({
      tagName: 'img',
      attribs: { ...attribs, loading: 'lazy', alt: String(attribs.alt || '').trim() },
    }),
  },
});

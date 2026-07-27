import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a', 'blockquote',
  'code', 'pre', 'strong', 'em', 'del', 'hr', 'br', 'figure', 'figcaption', 'img',
];

export async function renderMarkdownSafe(markdown: string) {
  const rendered = await marked.parse(markdown, { gfm: true, breaks: false });
  return sanitizeHtml(rendered, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (_tagName, attributes) => {
        const external = /^https?:\/\//i.test(attributes.href ?? '');
        return {
          tagName: 'a',
          attribs: external
            ? { ...attributes, target: '_blank', rel: 'noopener noreferrer' }
            : attributes,
        };
      },
      img: (_tagName, attributes) => ({
        tagName: 'img',
        attribs: { ...attributes, loading: 'lazy', decoding: 'async' },
      }),
    },
  });
}

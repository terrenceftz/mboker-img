import { z } from 'zod';

import { normalizeSlug } from './category';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');
const optionalCover = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().url().nullable().optional().default(null),
);

export const postInput = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().transform(normalizeSlug).pipe(z.string().min(1).max(160)),
  excerpt: optionalText(1_000),
  markdown: z.string().max(200_000).optional().default(''),
  coverUrl: optionalCover,
  seoTitle: optionalText(160),
  seoDescription: optionalText(500),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  publishedAt: z.string().trim().optional().default(''),
});

export function postValues(input: z.infer<typeof postInput>) {
  const parsedDate = input.publishedAt ? new Date(input.publishedAt) : null;
  return {
    ...input,
    publishedAt: input.status === 'published'
      ? parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date()
      : null,
  };
}

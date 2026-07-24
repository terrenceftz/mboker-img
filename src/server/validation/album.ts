import { z } from 'zod';

import { normalizeSlug } from './category';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');
const stringList = z.array(z.string().trim().min(1).max(80)).max(30).optional().default([]);

export const albumInput = z.object({
  categoryId: z.coerce.number().int().positive('请选择所属分类'),
  title: z.string().trim().min(1, '请填写图集名称').max(80, '图集名称最多 80 个字符'),
  titleEn: optionalText(80),
  slug: z
    .string()
    .transform(normalizeSlug)
    .pipe(z.string().min(1, '请填写有效的英文 slug').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  description: optionalText(4_000),
  shotDate: optionalText(40),
  location: optionalText(120),
  tags: stringList,
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  seoKeywords: stringList,
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const albumReorderInput = z.object({
  categoryId: z.coerce.number().int().positive(),
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

export type AlbumInput = z.infer<typeof albumInput>;

import { z } from 'zod';

export function normalizeSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');
const optionalImageUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z
    .string()
    .trim()
    .url()
    .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), '请使用 HTTP 或 HTTPS 图片地址')
    .nullable()
    .optional()
    .default(null),
);

export const categoryInput = z.object({
  title: z.string().trim().min(1, '请填写分类名称').max(80, '分类名称最多 80 个字符'),
  titleEn: optionalText(80),
  slug: z
    .string()
    .transform(normalizeSlug)
    .pipe(z.string().min(1, '请填写有效的英文 slug').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  description: optionalText(2_000),
  coverUrl: optionalImageUrl,
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const categoryReorderInput = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

export type CategoryInput = z.infer<typeof categoryInput>;

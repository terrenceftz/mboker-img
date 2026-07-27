import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max).optional().default('');
const optionalLink = z.string().trim().max(500).refine(
  (value) => value === '' || value.startsWith('/') || /^(https?:\/\/|mailto:)/i.test(value),
  '请输入有效的网址、邮箱链接或站内路径',
).optional().default('');

export const aboutInput = z.object({
  name: z.string().trim().min(1, '请填写姓名').max(100),
  role: text(120),
  intro: text(2_000),
  biography: text(10_000),
  email: z.string().trim().email('请输入有效邮箱').or(z.literal('')).optional().default(''),
  portraitSource: z.enum(['upload', 'external']).optional().default('upload'),
  portraitUrl: optionalLink,
  seoTitle: text(160),
  seoDescription: text(500),
  profileItems: z.array(z.object({
    label: z.string().trim().min(1, '请填写项目名称').max(80),
    value: text(1_000),
    href: optionalLink,
    external: z.boolean().optional().default(false),
  })).max(30).optional().default([]),
  socialLinks: z.array(z.object({
    label: z.string().trim().min(1, '请填写平台名称').max(80),
    handle: text(160),
    href: optionalLink,
  })).max(30).optional().default([]),
});

import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max).optional().default('');
const analyticsId = (pattern: RegExp, message: string) => z.string().trim().max(100).refine(
  (value) => value === '' || pattern.test(value),
  message,
).optional();
const homepageImageUrl = z.string().trim().max(500).refine(
  (value) => value === '' || value.startsWith('/media/') || value.startsWith('https://'),
  '请使用 HTTPS 图片外链或后台上传的图片',
).optional().default('');

export const settingsInput = z.object({
  siteName: z.string().trim().min(1, '请填写站点名称').max(120),
  shortName: z.string().trim().min(1, '请填写短名称').max(40),
  siteUrl: z.string().trim().url('请输入完整站点网址'),
  locale: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, '语言格式应类似 zh-CN'),
  homeTitle: text(160),
  homeIntro: text(2_000),
  homeHeroUrl: homepageImageUrl,
  homeSideUrl: homepageImageUrl,
  defaultSeoTitle: text(160),
  defaultSeoDescription: text(500),
  analyticsJson: z.object({
    google: analyticsId(/^G-[A-Z0-9-]+$/i, 'Google ID 格式无效'),
    baidu: analyticsId(/^[a-z0-9]+$/i, '百度统计 ID 格式无效'),
  }).strict().optional().default({}),
});

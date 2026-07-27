import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamps = () => ({
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export type ResponsivePhotoVariant = {
  width: number;
  url: string;
};

export type PhotoVariants = {
  webp?: ResponsivePhotoVariant[];
  avif?: ResponsivePhotoVariant[];
};

export type StoredResponsiveSize = Partial<
  Record<'default' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', string>
>;

export type StoredPhotoLayout = {
  cols?: StoredResponsiveSize;
  offset?: StoredResponsiveSize;
  align?: 'start' | 'center' | 'end';
  class?: string;
  hasBackground?: boolean;
  padding?: string;
};

export type SpecialLayoutRatio = '1:1' | '2:3' | '3:2';

export type SpecialLayoutBlock =
  | { id: string; type: 'image'; photoId: number }
  | { id: string; type: 'markdown'; markdown: string }
  | {
      id: string;
      type: 'split';
      direction: 'image-text' | 'text-image';
      ratio: SpecialLayoutRatio;
      verticalAlign: 'start' | 'center' | 'end';
      photoId: number;
      markdown: string;
    }
  | {
      id: string;
      type: 'twoImages';
      ratio: SpecialLayoutRatio;
      leftPhotoId: number;
      rightPhotoId: number;
    };

export type SpecialLayoutDocument = {
  version: 1;
  blocks: SpecialLayoutBlock[];
};

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  titleEn: text('title_en').notNull().default(''),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  coverUrl: text('cover_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  ...timestamps(),
});

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  titleEn: text('title_en').notNull().default(''),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  shotDate: text('shot_date').notNull().default(''),
  location: text('location').notNull().default(''),
  tagsJson: text('tags_json', { mode: 'json' }).$type<string[]>().notNull().default([]),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  seoKeywordsJson: text('seo_keywords_json', { mode: 'json' }).$type<string[]>().notNull().default([]),
  coverPhotoId: integer('cover_photo_id'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  legacyPath: text('legacy_path'),
  isSpecial: integer('is_special', { mode: 'boolean' }).notNull().default(false),
  specialLayoutJson: text('special_layout_json', { mode: 'json' })
    .$type<SpecialLayoutDocument>()
    .notNull()
    .default({ version: 1, blocks: [] }),
  ...timestamps(),
});

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  albumId: integer('album_id')
    .notNull()
    .references(() => albums.id, { onDelete: 'cascade' }),
  sourceType: text('source_type', { enum: ['upload', 'external'] }).notNull().default('upload'),
  originalUrl: text('original_url').notNull(),
  variantsJson: text('variants_json', { mode: 'json' }).$type<PhotoVariants>().notNull().default({}),
  thumbnailUrl: text('thumbnail_url'),
  alt: text('alt').notNull().default(''),
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').notNull().default(0),
  layoutPreset: text('layout_preset', { enum: ['auto', 'wide', 'standard', 'narrow'] })
    .notNull()
    .default('auto'),
  align: text('align', { enum: ['start', 'center', 'end'] }).notNull().default('center'),
  hasBackground: integer('has_background', { mode: 'boolean' }).notNull().default(false),
  padding: text('padding').notNull().default(''),
  layoutJson: text('layout_json', { mode: 'json' }).$type<StoredPhotoLayout>().notNull().default({}),
  ...timestamps(),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull().default(''),
  markdown: text('markdown').notNull().default(''),
  coverUrl: text('cover_url'),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  ...timestamps(),
});

export const aboutPages = sqliteTable('about_pages', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default(''),
  intro: text('intro').notNull().default(''),
  biography: text('biography').notNull().default(''),
  email: text('email').notNull().default(''),
  portraitSource: text('portrait_source', { enum: ['upload', 'external'] }).notNull().default('upload'),
  portraitUrl: text('portrait_url').notNull().default(''),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  ...timestamps(),
});

export const aboutProfileItems = sqliteTable('about_profile_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  value: text('value').notNull().default(''),
  href: text('href').notNull().default(''),
  external: integer('external', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const socialLinks = sqliteTable('social_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  handle: text('handle').notNull().default(''),
  href: text('href').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  siteName: text('site_name').notNull().default(''),
  shortName: text('short_name').notNull().default(''),
  siteUrl: text('site_url').notNull().default(''),
  locale: text('locale').notNull().default('zh-CN'),
  homeTitle: text('home_title').notNull().default(''),
  homeIntro: text('home_intro').notNull().default(''),
  homeHeroUrl: text('home_hero_url').notNull().default(''),
  homeSideUrl: text('home_side_url').notNull().default(''),
  defaultSeoTitle: text('default_seo_title').notNull().default(''),
  defaultSeoDescription: text('default_seo_description').notNull().default(''),
  analyticsJson: text('analytics_json', { mode: 'json' }).$type<Record<string, string>>().notNull().default({}),
  ...timestamps(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

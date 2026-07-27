import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { count, eq } from 'drizzle-orm';

import { readGalleryModule, type LegacyGallery, type LegacyGalleryImage } from './legacy/read-gallery-module';
import { createDatabase, resolveDatabasePath } from '../src/server/db/client';
import { runMigrations } from '../src/server/db/migrate';
import {
  aboutPages,
  aboutProfileItems,
  albums,
  categories,
  photos,
  posts,
  siteSettings,
  socialLinks,
} from '../src/server/db/schema';
import { processUpload } from '../src/server/media/upload';
import { removeLocalMedia } from '../src/server/media/remove';
import type { ProcessedUpload } from '../src/server/media/types';
import { createAlbum, updateAlbum } from '../src/server/repositories/albums';
import { upsertAbout } from '../src/server/repositories/about';
import { createCategory, updateCategory } from '../src/server/repositories/categories';
import { createUploadedPhoto } from '../src/server/repositories/photos';
import { createPost } from '../src/server/repositories/posts';
import { upsertSettings } from '../src/server/repositories/settings';
import type { CmsDatabase } from '../src/server/repositories/shared';
import { createAltaySpecialLayout } from './backfill-altay-special';

const DEFAULT_GALLERIES = ['sunset', 'city', 'nature', 'moment', 'altay'] as const;

const SITE_SEED = {
  settings: {
    siteName: 'Mboker Img',
    shortName: 'Mboker Img',
    siteUrl: 'https://tinks.netlify.app',
    locale: 'zh-CN',
    homeTitle: '影像故事',
    homeIntro: '欢迎来到 Mboker Img，记录城市、自然与旅途中的影像故事。',
    defaultSeoTitle: 'Mboker Img',
    defaultSeoDescription: '欢迎来到 Mboker Img，记录城市、自然与旅途中的影像故事。',
    analyticsJson: {},
  },
  about: {
    name: 'Mboker Img',
    role: '摄影',
    intro: '开始学习用镜头，记录生活和旅途的每一刻。',
    biography: '自由职业，偶尔与工作室或个人合作摄影。热衷于将优秀的审美和设计理念融入生活与工作。',
    email: 'hello@ricoui.com',
    portraitSource: 'upload' as const,
    portraitUrl: '',
    seoTitle: 'Mboker Img',
    seoDescription: '欢迎来到 Mboker Img，记录城市、自然与旅途中的影像故事。',
    profileItems: [
      { label: '我是', value: 'Mboker Img', href: '', external: false },
      { label: '介绍', value: '开始学习用镜头，记录生活和旅途的每一刻。', href: '', external: false },
      { label: 'Github', value: 'tink-photography', href: 'https://github.com/ricocc/tink-photography', external: true },
      { label: 'Pexels', value: '@Tink S', href: 'https://www.pexels.com/@tink-s-838159870/', external: true },
      { label: '小红书', value: '@苦瓜柠檬茶', href: '', external: false },
      { label: '邮件', value: 'hello@ricoui.com', href: 'mailto:hello@ricoui.com', external: false },
      { label: '信息', value: '自由职业，偶尔与工作室或个人合作摄影。从事过多年的外贸行业，英语交流通顺。热衷于将优秀的审美和设计理念融入到生活和工作之中，充满美的乐趣。', href: '', external: false },
    ],
    socialLinks: [
      { label: 'Pexels', handle: '@Tink S', href: 'https://www.pexels.com/@tink-s-838159870/' },
      { label: 'Github', handle: 'tink-photography', href: 'https://github.com/ricocc/tink-photography' },
      { label: 'Instagram', handle: '/', href: '' },
      { label: '设计&开发', handle: 'RicoUI', href: 'https://ricoui.com/?ref=Tink' },
    ],
  },
};

export type LegacyMediaImporter = (sourcePath: string, albumId: number) => Promise<ProcessedUpload>;

export type ImportLegacyOptions = {
  db: CmsDatabase;
  force?: boolean;
  galleries?: LegacyGallery[];
  galleryDirectory?: string;
  contentDirectory?: string;
  importPosts?: boolean;
  uploadRoot?: string;
  mediaImporter?: LegacyMediaImporter;
  mediaRemover?: (originalUrl: string) => Promise<unknown>;
};

export type LegacyImportCounts = {
  categories: number;
  albums: number;
  photos: number;
  posts: number;
  settings: number;
  about: number;
};

function tableCount(db: CmsDatabase, table: typeof categories | typeof albums | typeof photos) {
  return db.select({ value: count() }).from(table).get()!.value;
}

function clearCmsContent(db: CmsDatabase) {
  db.transaction((tx: CmsDatabase) => {
    tx.delete(aboutProfileItems).run();
    tx.delete(socialLinks).run();
    tx.delete(photos).run();
    tx.delete(albums).run();
    tx.delete(categories).run();
    tx.delete(posts).run();
    tx.delete(aboutPages).run();
    tx.delete(siteSettings).run();
  });
}

async function defaultGalleries(directory: string) {
  return Promise.all(DEFAULT_GALLERIES.map((slug) => readGalleryModule(resolve(directory, `${slug}.ts`))));
}

function mimeType(filename: string) {
  switch (extname(filename).toLowerCase()) {
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.avif': return 'image/avif';
    case '.gif': return 'image/gif';
    default: return 'image/jpeg';
  }
}

function defaultMediaImporter(uploadRoot?: string): LegacyMediaImporter {
  return async (sourcePath, albumId) => {
    const bytes = await readFile(sourcePath);
    const file = new File([new Uint8Array(bytes)], basename(sourcePath), { type: mimeType(sourcePath) });
    return processUpload(file, { kind: 'album', id: albumId }, { root: uploadRoot });
  };
}

function layoutPreset(image: LegacyGalleryImage, automatic: ProcessedUpload['automaticLayout']) {
  const widths = image.layout.cols;
  const desktop = widths?.xxl ?? widths?.xl ?? widths?.lg ?? widths?.md ?? widths?.sm ?? widths?.default;
  const columns = desktop ? Number(desktop) : Number.NaN;
  if (!Number.isFinite(columns)) return automatic;
  if (columns <= 4) return 'narrow' as const;
  if (columns >= 10) return 'wide' as const;
  return 'standard' as const;
}

async function importGallery(
  db: CmsDatabase,
  gallery: LegacyGallery,
  sortOrder: number,
  importer: LegacyMediaImporter,
  remover: (originalUrl: string) => Promise<unknown>,
) {
  const importedMedia: ProcessedUpload[] = [];
  const category = createCategory(db, {
    title: gallery.title,
    titleEn: gallery.titleEn,
    slug: gallery.slug,
    description: gallery.description,
    sortOrder,
    status: 'published',
  });
  const album = createAlbum(db, {
    categoryId: category.id,
    title: gallery.title,
    titleEn: gallery.titleEn,
    slug: gallery.slug,
    description: gallery.description,
    shotDate: gallery.date,
    location: gallery.location ?? '',
    tagsJson: gallery.tags ?? [],
    seoTitle: gallery.seo?.title?.replaceAll('Tink Photo', 'Mboker Img') ?? '',
    seoDescription: gallery.seo?.description ?? '',
    seoKeywordsJson: gallery.seo?.keywords ?? [],
    featured: gallery.featured ?? false,
    sortOrder,
    status: 'published',
    legacyPath: gallery.slug === 'altay' ? '/posts/altay' : `/collection/${gallery.slug}`,
  });

  try {
    const rows: Array<{ image: LegacyGalleryImage; media: ProcessedUpload; index: number }> = [];
    for (const [index, image] of gallery.images.entries()) {
      const media = await importer(image.sourcePath, album.id);
      importedMedia.push(media);
      rows.push({ image, media, index });
    }

    const created = db.transaction((tx: CmsDatabase) => {
      const photoRows = rows.map(({ image, media, index }) => createUploadedPhoto(tx, {
        albumId: album.id,
        originalUrl: media.originalUrl,
        variantsJson: media.variants,
        thumbnailUrl: media.thumbnailUrl,
        width: media.width,
        height: media.height,
        alt: image.alt,
        sortOrder: image.order ?? index,
        layoutPreset: layoutPreset(image, media.automaticLayout),
        align: image.layout.align ?? 'center',
        hasBackground: image.layout.hasBackground ?? false,
        padding: image.layout.padding ?? '',
        layoutJson: image.layout,
      }));
      const cover = createdCover(photoRows, gallery.coverIndex);
      updateAlbum(tx, album.id, {
        coverPhotoId: cover?.id ?? null,
        ...(gallery.slug === 'altay'
          ? { isSpecial: true, specialLayoutJson: createAltaySpecialLayout(photoRows) }
          : {}),
      });
      updateCategory(tx, category.id, { coverUrl: cover?.thumbnailUrl ?? cover?.originalUrl ?? null });
      return photoRows;
    });
    return created.length;
  } catch (error) {
    db.delete(albums).where(eq(albums.id, album.id)).run();
    db.delete(categories).where(eq(categories.id, category.id)).run();
    await Promise.allSettled(importedMedia.map((media) => remover(media.originalUrl)));
    throw error;
  }
}

function createdCover<T>(rows: T[], coverIndex = 0) {
  return rows[coverIndex] ?? rows[0];
}

function parseFrontmatter(source: string) {
  const match = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/.exec(source);
  if (!match) return { attributes: {} as Record<string, string>, markdown: source };
  const attributes: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const property = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (property && !property[2]!.startsWith('#')) attributes[property[1]!] = property[2]!.replace(/^['"]|['"]$/g, '');
  }
  return { attributes, markdown: match[2]! };
}

async function importMarkdownPosts(db: CmsDatabase, directory: string) {
  const filenames = (await readdir(directory)).filter((filename) => filename.endsWith('.md')).sort();
  for (const filename of filenames) {
    const source = await readFile(resolve(directory, filename), 'utf8');
    const { attributes, markdown } = parseFrontmatter(source);
    const template = /template/i.test(filename);
    const publishedAt = !template && attributes.publishDate ? new Date(attributes.publishDate) : null;
    createPost(db, {
      title: attributes.title || basename(filename, '.md'),
      slug: basename(filename, '.md'),
      excerpt: attributes.description ?? '',
      markdown,
      coverUrl: attributes.img || null,
      status: publishedAt && !Number.isNaN(publishedAt.getTime()) ? 'published' : 'draft',
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    });
  }
  return filenames.length;
}

export async function importLegacyContent(options: ImportLegacyOptions): Promise<LegacyImportCounts> {
  const populated = tableCount(options.db, categories) + tableCount(options.db, albums) + tableCount(options.db, photos);
  if (populated && !options.force) throw new Error('CMS content tables are not empty; rerun with --force to replace them.');
  if (options.force) clearCmsContent(options.db);

  const galleryDirectory = options.galleryDirectory ?? resolve('src/data/gallery');
  const galleries = options.galleries ?? await defaultGalleries(galleryDirectory);
  const importer = options.mediaImporter ?? defaultMediaImporter(options.uploadRoot);
  const remover = options.mediaRemover ?? ((url) => removeLocalMedia(options.uploadRoot ?? process.env.UPLOAD_ROOT ?? 'data/uploads', url));
  const counts: LegacyImportCounts = { categories: 0, albums: 0, photos: 0, posts: 0, settings: 0, about: 0 };

  for (const [index, gallery] of galleries.entries()) {
    counts.photos += await importGallery(options.db, gallery, index, importer, remover);
    counts.categories += 1;
    counts.albums += 1;
  }

  if (options.importPosts !== false) {
    counts.posts = await importMarkdownPosts(options.db, options.contentDirectory ?? resolve('src/content/blog'));
  }
  upsertSettings(options.db, SITE_SEED.settings);
  upsertAbout(options.db, SITE_SEED.about);
  counts.settings = 1;
  counts.about = 1;
  return counts;
}

async function runCli() {
  const databasePath = resolveDatabasePath();
  runMigrations(databasePath);
  const connection = createDatabase(databasePath);
  try {
    const counts = await importLegacyContent({
      db: connection.db,
      force: process.argv.includes('--force'),
      uploadRoot: process.env.UPLOAD_ROOT,
    });
    console.log(JSON.stringify(counts, null, 2));
  } finally {
    connection.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCli();
}

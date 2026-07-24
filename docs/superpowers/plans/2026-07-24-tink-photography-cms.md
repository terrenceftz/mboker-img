# Tink Photography CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Preserve the supplied Tink photography frontend while adding a production-ready, single-admin CMS for categories, albums, photos, posts, the About page, and site settings.

**Architecture:** Convert the existing Astro site to Node SSR and keep visitor-facing components and animation assets intact. Put editable content behind focused repositories and services backed by SQLite, store uploaded images in a persistent filesystem volume, and expose protected Astro admin pages and API routes in the same application.

**Tech Stack:** Astro 7, TypeScript, Astro Node adapter, Drizzle ORM, SQLite/better-sqlite3, Zod, Argon2, Sharp, SortableJS, Marked, sanitize-html, Archiver, Vitest, Playwright, Docker Compose

---

## Delivery boundaries

The work is delivered in four testable milestones:

1. Runtime foundation: source import, SSR, database, authentication, and media storage.
2. Photography CMS: categories, albums, photos, legacy migration, and dynamic visitor galleries.
3. Editorial CMS: posts, About page, site settings, and dynamic visitor editorial pages.
4. Operations: Docker, backups, end-to-end tests, responsive screenshots, and deployment documentation.

## File map

The supplied archive is imported first. Existing visitor files remain in place unless listed below.

- Modify: package.json - SSR, database, CMS, test, and operational scripts.
- Modify: astro.config.mjs - Node SSR adapter and image-domain configuration.
- Create: drizzle.config.ts - migration configuration.
- Create: src/server/db/schema.ts - all persisted entities.
- Create: src/server/db/client.ts - SQLite connection lifecycle.
- Create: src/server/db/migrate.ts - migration runner.
- Create: src/server/auth/* - credentials, sessions, cookies, and route guards.
- Create: src/server/media/* - local upload processing and external URL validation.
- Create: src/pages/media/[...path].ts - traversal-safe delivery of persisted local images.
- Create: src/server/repositories/* - query and mutation boundaries per content domain.
- Create: src/server/validation/* - reusable Zod schemas.
- Create: src/middleware.ts - admin authentication and security headers.
- Create: src/pages/admin/* - login and protected management screens.
- Create: src/pages/api/admin/* - authenticated mutation endpoints.
- Create: src/components/admin/* - admin shell, tables, forms, editor controls, and notices.
- Create: src/styles/admin.scss - compact responsive admin styling.
- Modify: src/pages/index.astro - database-backed home content.
- Modify/Create: src/pages/collection/* - category and album compatibility routes.
- Modify: src/pages/blog.astro and src/pages/blog/[...slug].astro - database-backed posts.
- Modify: src/pages/about.astro - database-backed About page.
- Create: scripts/import-legacy-content.ts - deterministic one-time importer.
- Create: scripts/hash-admin-password.ts - deployment credential helper.
- Create: scripts/backup.ts - SQLite and uploads backup helper.
- Create: tests/unit/* and tests/integration/* - service and repository tests.
- Create: tests/e2e/* - visitor and administrator browser flows.
- Create: Dockerfile, docker-compose.yml, .dockerignore, .env.example.
- Modify: README.md - local setup, migration, backup, and VPS deployment.

### Task 1: Import the supplied Astro project and establish the SSR test harness

**Files:**
- Import: C:/Users/HUAWEI/Desktop/tink-photography-main.zip
- Modify: .gitignore
- Modify: package.json
- Modify: astro.config.mjs
- Create: vitest.config.ts
- Create: tests/unit/smoke.test.ts

- [ ] **Step 1: Select a compatible Node runtime**

Run:

~~~powershell
$env:Path='C:\Users\HUAWEI\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\override;' + $env:Path
node --version
pnpm --version
~~~

Expected in the current Codex workspace: Node v24.14.0 and pnpm 11.9.0. The project requires Node 22.12.0 or newer.

- [ ] **Step 2: Extract the archive into a temporary directory and copy the project root**

Run:

~~~powershell
New-Item -ItemType Directory -Force .tmp\upstream
Expand-Archive -LiteralPath 'C:\Users\HUAWEI\Desktop\tink-photography-main.zip' -DestinationPath .tmp\upstream -Force
Copy-Item -Path '.tmp\upstream\tink-photography-main\*' -Destination . -Recurse -Force
~~~

Expected: src, public, package.json, astro.config.mjs, and pnpm-lock.yaml exist at the repository root. Preserve docs and merge the upstream ignore rules with .superpowers/, .tmp/, data/, backups/, and test-results/.

- [ ] **Step 3: Install the runtime and test dependencies**

Run:

~~~powershell
pnpm add @astrojs/node drizzle-orm better-sqlite3 zod argon2 marked sanitize-html sortablejs lucide-astro archiver
pnpm add -D drizzle-kit vitest @playwright/test @types/better-sqlite3 @types/sanitize-html @types/archiver tsx
~~~

Expected: pnpm-lock.yaml updates without peer dependency errors.

- [ ] **Step 4: Add scripts and switch Astro to Node SSR**

Set the package scripts to include:

~~~json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/server/db/migrate.ts",
    "content:import": "tsx scripts/import-legacy-content.ts",
    "admin:hash": "tsx scripts/hash-admin-password.ts",
    "backup": "tsx scripts/backup.ts"
  }
}
~~~

Configure astro.config.mjs with output: 'server' and adapter: node({ mode: 'standalone' }); preserve the existing aliases and site configuration.

- [ ] **Step 5: Write and run a smoke test**

~~~ts
import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/config/site';

describe('upstream import', () => {
  it('keeps the Tink visitor identity', () => {
    expect(siteConfig.shortName).toBe('Tink.');
    expect(siteConfig.locale).toBe('zh-CN');
  });
});
~~~

Run: pnpm test tests/unit/smoke.test.ts

Expected: PASS with one test and no Astro import error.

- [ ] **Step 6: Verify the untouched frontend builds**

Run: pnpm check

Expected: zero Astro errors.

- [ ] **Step 7: Commit**

~~~powershell
git add .gitignore package.json pnpm-lock.yaml astro.config.mjs vitest.config.ts public src tests/unit/smoke.test.ts
git commit -m "chore: import Tink Astro frontend and enable SSR"
~~~

### Task 2: Add the SQLite schema and migration lifecycle

**Files:**
- Create: drizzle.config.ts
- Create: src/server/db/schema.ts
- Create: src/server/db/client.ts
- Create: src/server/db/migrate.ts
- Create: tests/helpers/database.ts
- Create: tests/unit/db-schema.test.ts

- [ ] **Step 1: Write the failing schema test**

~~~ts
import { afterEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../helpers/database';

describe('content schema', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

  it('enforces unique slugs and album ownership', async () => {
    const testDb = createTestDatabase();
    cleanups.push(testDb.close);
    const category = await testDb.seedCategory({ title: '城市', slug: 'city' });
    await expect(testDb.seedCategory({ title: '重复', slug: 'city' })).rejects.toThrow();
    const album = await testDb.seedAlbum({ categoryId: category.id, title: '夜景', slug: 'city-night' });
    expect(album.categoryId).toBe(category.id);
  });
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/unit/db-schema.test.ts

Expected: FAIL because tests/helpers/database.ts does not exist.

- [ ] **Step 3: Implement the schema**

Define these exported Drizzle tables in src/server/db/schema.ts:

~~~ts
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
};

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  titleEn: text('title_en').notNull().default(''),
  slug: text('slug').notNull(),
  description: text('description').notNull().default(''),
  coverUrl: text('cover_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  ...timestamps,
}, (table) => [uniqueIndex('categories_slug_unique').on(table.slug)]);

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  titleEn: text('title_en').notNull().default(''),
  slug: text('slug').notNull(),
  description: text('description').notNull().default(''),
  shotDate: text('shot_date').notNull().default(''),
  location: text('location').notNull().default(''),
  tagsJson: text('tags_json').notNull().default('[]'),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  seoKeywordsJson: text('seo_keywords_json').notNull().default('[]'),
  coverPhotoId: integer('cover_photo_id'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  legacyPath: text('legacy_path'),
  ...timestamps,
}, (table) => [uniqueIndex('albums_slug_unique').on(table.slug)]);

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  albumId: integer('album_id').notNull().references(() => albums.id, { onDelete: 'cascade' }),
  sourceType: text('source_type', { enum: ['upload', 'external'] }).notNull(),
  originalUrl: text('original_url').notNull(),
  variantsJson: text('variants_json').notNull().default('{}'),
  thumbnailUrl: text('thumbnail_url'),
  alt: text('alt').notNull().default(''),
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').notNull().default(0),
  layoutPreset: text('layout_preset').notNull().default('auto'),
  align: text('align', { enum: ['start', 'center', 'end'] }).notNull().default('center'),
  hasBackground: integer('has_background', { mode: 'boolean' }).notNull().default(false),
  padding: text('padding').notNull().default(''),
  ...timestamps,
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  excerpt: text('excerpt').notNull().default(''),
  markdown: text('markdown').notNull().default(''),
  coverUrl: text('cover_url'),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  ...timestamps,
}, (table) => [uniqueIndex('posts_slug_unique').on(table.slug)]);

export const aboutPages = sqliteTable('about_pages', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull().default(''),
  intro: text('intro').notNull().default(''),
  biography: text('biography').notNull().default(''),
  email: text('email').notNull().default(''),
  portraitSource: text('portrait_source', { enum: ['upload', 'external'] }).notNull().default('upload'),
  portraitUrl: text('portrait_url'),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  ...timestamps,
});

export const aboutProfileItems = sqliteTable('about_profile_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  value: text('value').notNull(),
  href: text('href'),
  external: integer('external', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const socialLinks = sqliteTable('social_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  handle: text('handle').notNull().default(''),
  href: text('href'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey(),
  siteName: text('site_name').notNull(),
  shortName: text('short_name').notNull(),
  siteUrl: text('site_url').notNull(),
  locale: text('locale').notNull().default('zh-CN'),
  homeTitle: text('home_title').notNull(),
  homeIntro: text('home_intro').notNull().default(''),
  defaultSeoTitle: text('default_seo_title').notNull(),
  defaultSeoDescription: text('default_seo_description').notNull().default(''),
  analyticsJson: text('analytics_json').notNull().default('{}'),
  ...timestamps,
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('sessions_token_hash_unique').on(table.tokenHash)]);
~~~

- [ ] **Step 4: Implement connection, migration, and test helpers**

src/server/db/client.ts must export createDatabase(filename), closeDatabase(), and the singleton db. Use DATABASE_PATH or data/tink.sqlite. Enable foreign_keys, journal_mode=WAL, busy_timeout=5000, and synchronous=NORMAL on every connection.

tests/helpers/database.ts creates a unique file under the operating-system temporary directory, runs migrations, exposes seedCategory and seedAlbum helpers, and removes the database plus -wal and -shm peers in close().

- [ ] **Step 5: Generate and run migrations**

Run:

~~~powershell
pnpm db:generate
pnpm db:migrate
pnpm test tests/unit/db-schema.test.ts
~~~

Expected: migration succeeds and the schema test passes.

- [ ] **Step 6: Commit**

~~~powershell
git add drizzle.config.ts drizzle src/server/db tests/helpers tests/unit/db-schema.test.ts
git commit -m "feat: add persistent content schema"
~~~

### Task 3: Implement single-admin authentication and route protection

**Files:**
- Create: src/server/auth/password.ts
- Create: src/server/auth/session.ts
- Create: src/server/auth/guard.ts
- Create: src/server/validation/auth.ts
- Create: src/middleware.ts
- Create: src/pages/admin/login.astro
- Create: src/pages/api/admin/login.ts
- Create: src/pages/api/admin/logout.ts
- Create: scripts/hash-admin-password.ts
- Create: tests/integration/auth.test.ts

- [ ] **Step 1: Write failing authentication tests**

~~~ts
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyAdminCredentials } from '../../src/server/auth/password';

describe('administrator credentials', () => {
  it('accepts only the configured username and password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyAdminCredentials('owner', 'correct horse battery staple', {
      username: 'owner',
      passwordHash: hash,
    })).toBe(true);
    expect(await verifyAdminCredentials('owner', 'wrong', {
      username: 'owner',
      passwordHash: hash,
    })).toBe(false);
  });
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/integration/auth.test.ts

Expected: FAIL because password.ts does not exist.

- [ ] **Step 3: Implement credential verification**

~~~ts
import argon2 from 'argon2';
import { timingSafeEqual } from 'node:crypto';

export interface AdminCredentialConfig {
  username: string;
  passwordHash: string;
}

export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });

export async function verifyAdminCredentials(
  username: string,
  password: string,
  config: AdminCredentialConfig,
): Promise<boolean> {
  const expected = Buffer.from(config.username);
  const actual = Buffer.from(username);
  const sameUsername = expected.length === actual.length && timingSafeEqual(expected, actual);
  return sameUsername && argon2.verify(config.passwordHash, password);
}
~~~

- [ ] **Step 4: Implement sessions and middleware**

Generate 32 random bytes per session, store only a SHA-256 token hash, expire sessions after 12 hours, and set a cookie named tink_admin_session with HttpOnly, SameSite=Strict, Secure in production, Path=/, and Max-Age=43200.

src/middleware.ts must redirect unauthenticated /admin routes except /admin/login and return 401 for unauthenticated /api/admin requests. Reject state-changing admin requests whose Origin does not match PUBLIC_SITE_URL. Add Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, and frame-ancestors protection without breaking existing visitor scripts or external HTTPS images.

- [ ] **Step 5: Add login throttling and endpoints**

Keep a bounded in-memory attempt map keyed by IP with five attempts per 15 minutes. Validate with Zod, return one generic Chinese failure message, rotate the session after successful login, and implement POST-only logout.

- [ ] **Step 6: Run tests and manually verify the guard**

Run:

~~~powershell
pnpm test tests/integration/auth.test.ts
pnpm check
~~~

Expected: all authentication tests pass and Astro reports no errors.

- [ ] **Step 7: Commit**

~~~powershell
git add src/server/auth src/server/validation/auth.ts src/middleware.ts src/pages/admin/login.astro src/pages/api/admin scripts/hash-admin-password.ts tests/integration/auth.test.ts
git commit -m "feat: protect admin with single-user sessions"
~~~

### Task 4: Build local and external image services

**Files:**
- Create: src/server/media/types.ts
- Create: src/server/media/paths.ts
- Create: src/server/media/upload.ts
- Create: src/server/media/external.ts
- Create: src/server/media/remove.ts
- Create: src/pages/media/[...path].ts
- Create: src/pages/api/admin/media/asset.ts
- Create: src/server/validation/media.ts
- Create: tests/unit/media.test.ts

- [ ] **Step 1: Write failing media tests**

~~~ts
import { describe, expect, it } from 'vitest';
import { validateExternalImageUrl } from '../../src/server/media/external';
import { chooseAutomaticLayout } from '../../src/server/media/types';

describe('media rules', () => {
  it('accepts public web image URLs without fetching them', () => {
    expect(validateExternalImageUrl('https://images.example.com/photo.jpg')).toBe('https://images.example.com/photo.jpg');
    expect(() => validateExternalImageUrl('file:///etc/passwd')).toThrow();
  });

  it('chooses stable presets from image proportions', () => {
    expect(chooseAutomaticLayout(2400, 1200)).toBe('wide');
    expect(chooseAutomaticLayout(1200, 1800)).toBe('narrow');
    expect(chooseAutomaticLayout(1600, 1200)).toBe('standard');
  });
});
~~~

- [ ] **Step 2: Run the tests to verify they fail**

Run: pnpm test tests/unit/media.test.ts

Expected: FAIL because media modules do not exist.

- [ ] **Step 3: Implement deterministic layout and external URL validation**

~~~ts
export type LayoutPreset = 'auto' | 'wide' | 'standard' | 'narrow';
export type ImageAlign = 'start' | 'center' | 'end';

export function chooseAutomaticLayout(width: number, height: number): Exclude<LayoutPreset, 'auto'> {
  const ratio = width / height;
  if (ratio >= 1.6) return 'wide';
  if (ratio <= 0.8) return 'narrow';
  return 'standard';
}
~~~

external.ts must parse with URL, allow only http: and https:, reject embedded credentials, and return the normalized URL. It must never call fetch.

- [ ] **Step 4: Implement transactional upload processing**

upload.ts accepts a File, a storage scope, storage root, and injectable clock/ID generator. A storage scope is either { kind: 'album', id: number } or { kind: 'site', key: 'category-cover' | 'post-cover' | 'about-portrait' }. Permit JPEG, PNG, WebP, AVIF, and GIF up to 30 MB. Write to a same-volume temporary directory, read dimensions with Sharp, preserve the original, create a 480px thumbnail plus 960px, 1600px, and 2400px WebP/AVIF variants, then atomically rename the completed directory.

Return:

~~~ts
export interface ProcessedUpload {
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  variants: Record<'webp' | 'avif', Array<{ width: number; url: string }>>;
  automaticLayout: 'wide' | 'standard' | 'narrow';
}
~~~

- [ ] **Step 5: Add rollback and deletion tests**

Inject a Sharp adapter that fails after the first derivative. Assert the temporary directory is removed and no final directory exists. Assert removeLocalPhoto deletes only paths resolved beneath the configured upload root. Exercise the media endpoint with a valid nested path, a missing file, ../ traversal, percent-encoded traversal, and a symbolic link escaping UPLOAD_ROOT.

- [ ] **Step 6: Add safe media delivery and generic asset upload**

src/pages/media/[...path].ts must resolve the requested path beneath UPLOAD_ROOT, reject traversal and symbolic-link escapes, return 404 for missing files, set the correct image Content-Type, add immutable caching for fingerprinted names, and stream rather than buffer the complete file.

src/pages/api/admin/media/asset.ts accepts one authenticated category cover, post cover, or About portrait upload and returns ProcessedUpload. Apply the same same-origin check used by all write endpoints.

- [ ] **Step 7: Run tests and commit**

Run: pnpm test tests/unit/media.test.ts

Expected: all media tests pass.

~~~powershell
git add src/server/media src/server/validation/media.ts src/pages/media src/pages/api/admin/media tests/unit/media.test.ts
git commit -m "feat: process uploads and accept external images"
~~~

### Task 5: Add repositories and deterministic legacy content import

**Files:**
- Create: src/server/repositories/categories.ts
- Create: src/server/repositories/albums.ts
- Create: src/server/repositories/photos.ts
- Create: src/server/repositories/home.ts
- Create: src/server/repositories/posts.ts
- Create: src/server/repositories/about.ts
- Create: src/server/repositories/settings.ts
- Create: scripts/legacy/read-gallery-module.ts
- Create: scripts/import-legacy-content.ts
- Create: tests/fixtures/legacy-gallery.ts
- Create: tests/unit/legacy-import.test.ts

- [ ] **Step 1: Write a failing parser/import test**

Create a fixture containing image imports and a GalleryConfig object using the same syntax as src/data/gallery/city.ts. Assert the parser resolves import identifiers to absolute source image paths and preserves title, slug, alt, responsive cols, alignment, background, padding, and array order.

~~~ts
const parsed = await readLegacyGallery(fixturePath);
expect(parsed.slug).toBe('city');
expect(parsed.images[0]).toMatchObject({
  alt: 'City architecture',
  layout: { align: 'center' },
});
expect(parsed.images[0].sourcePath.endsWith('001.jpg')).toBe(true);
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/unit/legacy-import.test.ts

Expected: FAIL because read-gallery-module.ts does not exist.

- [ ] **Step 3: Implement the safe TypeScript AST reader**

Use the installed TypeScript compiler API. Parse import declarations into an identifier-to-path map and evaluate only string, number, boolean, null, array, object, and known image-import identifier nodes. Reject calls, property access, computed keys, spread syntax, and unknown identifiers. Never execute the legacy module.

- [ ] **Step 4: Implement focused repositories**

Each repository receives a database instance. Visitor queries return only published parents and children ordered by sortOrder then id. Admin queries include drafts. Mutation methods validate uniqueness and use transactions for reorder operations. Category deletion must return a typed CATEGORY_NOT_EMPTY conflict when albums exist.

- [ ] **Step 5: Implement the importer**

The importer must:

1. Refuse to run when categories, albums, or photos already contain rows unless --force is supplied.
2. Parse sunset.ts, nature.ts, city.ts, moment.ts, and altay.ts.
3. Create one category and one same-name album per legacy gallery.
4. Copy every source image through the local media service and preserve its manual layout metadata.
5. Import article Markdown files, site.ts values, About content, profile entries, and social links.
6. Preserve /collection/sunset, /collection/nature, /collection/city, /collection/moment, /collection/altay, and /posts/altay in legacyPath mappings.
7. Commit each gallery in one database transaction and print imported counts.

- [ ] **Step 6: Test idempotency and run against a temporary database**

Run:

~~~powershell
pnpm test tests/unit/legacy-import.test.ts
$env:DATABASE_PATH='.tmp\import-test.sqlite'
$env:UPLOAD_ROOT='.tmp\import-uploads'
pnpm content:import
pnpm content:import
~~~

Expected: the first import reports five categories and all source images; the second refuses without creating duplicates.

- [ ] **Step 7: Commit**

~~~powershell
git add src/server/repositories scripts/legacy scripts/import-legacy-content.ts tests/fixtures tests/unit/legacy-import.test.ts
git commit -m "feat: import legacy photography content"
~~~

### Task 6: Build the admin shell, dashboard, category, and album workflows

**Files:**
- Create: src/layouts/AdminLayout.astro
- Create: src/components/admin/AdminSidebar.astro
- Create: src/components/admin/PageHeader.astro
- Create: src/components/admin/FieldError.astro
- Create: src/components/admin/ConfirmDialog.astro
- Create: src/styles/admin.scss
- Create: src/pages/admin/index.astro
- Create: src/pages/admin/categories/index.astro
- Create: src/pages/admin/categories/new.astro
- Create: src/pages/admin/categories/[id].astro
- Create: src/pages/admin/albums/index.astro
- Create: src/pages/admin/albums/new.astro
- Create: src/pages/admin/albums/[id].astro
- Create: src/pages/api/admin/categories/*.ts
- Create: src/pages/api/admin/albums/*.ts
- Create: src/server/validation/category.ts
- Create: src/server/validation/album.ts
- Create: tests/integration/category-album-admin.test.ts

- [ ] **Step 1: Write failing CRUD and conflict tests**

Test create, edit, publish, reorder, and delete for both resources. Assert duplicate slugs return 409, missing fields return 422 with field errors, unauthenticated requests return 401, and deleting a non-empty category returns CATEGORY_NOT_EMPTY.

- [ ] **Step 2: Run the integration test to verify it fails**

Run: pnpm test tests/integration/category-album-admin.test.ts

Expected: FAIL because the routes do not exist.

- [ ] **Step 3: Implement Zod schemas and authenticated endpoints**

categoryInput must normalize slug to lowercase ASCII segments, require 1-80 title characters, accept optional English title/description/cover URL, and restrict status. albumInput additionally requires categoryId, accepts date/location/tags/SEO/featured, and verifies the category exists.

Every endpoint must call the corresponding repository and translate typed errors into 401, 404, 409, or 422 responses.

- [ ] **Step 4: Build the selected sidebar admin UI**

Use a fixed 216px desktop sidebar, a compact mobile drawer, 36-40px controls, square 4-6px radii, restrained black/white/neutral colors, and lucide-astro icons with tooltips for icon-only actions. Do not change src/styles/global.scss for admin-only styling.

Dashboard cards show category, album, photo, and post counts. Tables include cover thumbnail, title, parent, status, count, updated date, edit action, and a kebab menu for destructive actions.

- [ ] **Step 5: Add accessible reorder and delete behavior**

Use SortableJS for pointer drag and provide Move up/Move down buttons for keyboard users. Persist the complete ordered ID list in one transaction. Confirm destructive actions in a dialog that names the target and keeps focus trapped until cancel or confirmation.

- [ ] **Step 6: Run tests, check Astro, and commit**

Run:

~~~powershell
pnpm test tests/integration/category-album-admin.test.ts
pnpm check
~~~

Expected: tests pass and no Astro errors remain.

~~~powershell
git add src/layouts/AdminLayout.astro src/components/admin src/styles/admin.scss src/pages/admin src/pages/api/admin/categories src/pages/api/admin/albums src/server/validation/category.ts src/server/validation/album.ts tests/integration/category-album-admin.test.ts
git commit -m "feat: manage photography categories and albums"
~~~

### Task 7: Build image library, upload, external URL, sorting, and layout controls

**Files:**
- Create: src/pages/admin/photos/index.astro
- Create: src/pages/admin/albums/[id]/photos.astro
- Create: src/components/admin/PhotoGrid.astro
- Create: src/components/admin/PhotoEditor.astro
- Create: src/components/admin/UploadDropzone.astro
- Create: src/components/admin/ExternalImageForm.astro
- Create: src/pages/api/admin/photos/upload.ts
- Create: src/pages/api/admin/photos/external.ts
- Create: src/pages/api/admin/photos/[id].ts
- Create: src/pages/api/admin/photos/reorder.ts
- Create: tests/integration/photo-admin.test.ts

- [ ] **Step 1: Write failing photo workflow tests**

Cover multi-file upload, external URL creation, metadata edit, cover selection, reorder, local deletion cleanup, external deletion without filesystem calls, and album cascade deletion. Assert an external URL is stored unchanged after normalization and has empty variants.

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/integration/photo-admin.test.ts

Expected: FAIL because photo routes do not exist.

- [ ] **Step 3: Implement photo endpoints**

Use multipart/form-data for upload, reject more than 30 files per request, call processUpload for each file, and roll back both database rows and newly created directories if any file fails. External creation accepts a URL list and alt text list without server fetches. Reorder accepts every album photo ID exactly once.

- [ ] **Step 4: Implement the photo management UI**

The grid has stable aspect-ratio thumbnails, selection checkboxes, upload progress, failed-item retry, batch delete, and drag sorting. The editor exposes alt text, auto/wide/standard/narrow preset, start/center/end alignment, background toggle, padding, and Set as cover. External images show a link badge and browser-side load failure state.

- [ ] **Step 5: Verify derived image output**

Upload a JPEG fixture and assert the original, 480px thumbnail, and all WebP/AVIF widths exist, have non-zero size, and do not exceed the source width.

- [ ] **Step 6: Run tests and commit**

Run:

~~~powershell
pnpm test tests/integration/photo-admin.test.ts tests/unit/media.test.ts
pnpm check
~~~

Expected: all photo and media tests pass.

~~~powershell
git add src/pages/admin/photos src/pages/admin/albums src/components/admin/PhotoGrid.astro src/components/admin/PhotoEditor.astro src/components/admin/UploadDropzone.astro src/components/admin/ExternalImageForm.astro src/pages/api/admin/photos tests/integration/photo-admin.test.ts
git commit -m "feat: manage uploaded and external gallery images"
~~~

### Task 8: Connect visitor photography pages to published database content

**Files:**
- Create: src/components/gallery/DynamicGalleryImage.astro
- Modify: src/components/gallery/Gallery.astro
- Modify: src/components/gallery/GalleryItem.astro
- Modify: src/components/Category.astro
- Modify: src/components/IndexCard.astro
- Modify: src/pages/index.astro
- Create: src/pages/collection/[category]/index.astro
- Create: src/pages/collection/[category]/[album].astro
- Modify: src/pages/collection/[slug].astro
- Modify: src/pages/posts/altay.astro
- Create: tests/integration/visitor-gallery.test.ts

- [ ] **Step 1: Write failing published-content and compatibility tests**

Seed one published category with one published album, one draft album, one local photo, and one external photo. Assert visitor queries exclude drafts, preserve sort order, emit srcset for local variants, use a direct src for external photos, and resolve every legacyPath.

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/integration/visitor-gallery.test.ts

Expected: FAIL because the visitor pages still read static modules.

- [ ] **Step 3: Add the dynamic image adapter**

DynamicGalleryImage accepts the same visual layout data consumed by GalleryItem. For uploads it emits picture sources for AVIF and WebP plus the original fallback; for external images it emits one lazy-loaded img. Always set width, height when known, alt, decoding=async, and a stable aspect ratio.

- [ ] **Step 4: Replace static content reads without rewriting visual markup**

Keep visitor HTML class names, SCSS, GSAP selectors, Lenis hooks, and Swiper initialization unchanged. Replace only imports of categoryItems, allGalleries, and fixed image modules with repository results. Maintain the nine-card homepage rhythm by applying existing nth-child layout classes to database-ordered featured items.

- [ ] **Step 5: Implement routes and legacy aliases**

Canonical album URLs are /collection/{categorySlug}/{albumSlug}. Existing /collection/{slug} and /posts/altay routes resolve legacyPath and render or redirect to the canonical album without a 404. Unknown or draft content returns the existing 404 experience.

- [ ] **Step 6: Run visitor tests and baseline screenshots**

Run:

~~~powershell
pnpm test tests/integration/visitor-gallery.test.ts
pnpm build
~~~

Expected: tests and production build pass.

- [ ] **Step 7: Commit**

~~~powershell
git add src/components/gallery src/components/Category.astro src/components/IndexCard.astro src/pages/index.astro src/pages/collection src/pages/posts/altay.astro tests/integration/visitor-gallery.test.ts
git commit -m "feat: render published galleries from SQLite"
~~~

### Task 9: Add blog editing and database-backed blog pages

**Files:**
- Create: src/server/validation/post.ts
- Create: src/server/markdown/render.ts
- Create: src/pages/admin/posts/index.astro
- Create: src/pages/admin/posts/new.astro
- Create: src/pages/admin/posts/[id].astro
- Create: src/components/admin/MarkdownEditor.astro
- Create: src/pages/api/admin/posts/*.ts
- Modify: src/pages/blog.astro
- Modify: src/pages/blog/[...slug].astro
- Create: tests/integration/posts.test.ts

- [ ] **Step 1: Write failing post and sanitization tests**

Assert draft isolation, published ordering, unique slug enforcement, Markdown headings/links/image rendering, script removal, javascript: URL removal, and cover support for uploads and external URLs.

- [ ] **Step 2: Run the tests to verify they fail**

Run: pnpm test tests/integration/posts.test.ts

Expected: FAIL because the post service and routes do not exist.

- [ ] **Step 3: Implement safe Markdown rendering**

Render with Marked, then sanitize with an explicit allow-list for headings, paragraphs, lists, links, blockquotes, code, pre, strong, em, figure, figcaption, and images. Force rel=noopener noreferrer on external links and reject non-http(s) image sources.

- [ ] **Step 4: Build post endpoints and editor**

The editor includes title, slug, excerpt, Markdown, cover, SEO, status, publish time, and a side-by-side live preview. Save remains explicit; preview is client-only and final visitor HTML always comes from the server sanitizer. Preserve submitted fields when validation returns 422.

- [ ] **Step 5: Replace visitor blog content collection reads**

Keep the current Blog page layout and article styling, but query published database posts. Return the existing 404 page for missing or draft slugs.

- [ ] **Step 6: Run tests and commit**

Run:

~~~powershell
pnpm test tests/integration/posts.test.ts
pnpm check
~~~

Expected: all post tests pass.

~~~powershell
git add src/server/validation/post.ts src/server/markdown src/pages/admin/posts src/components/admin/MarkdownEditor.astro src/pages/api/admin/posts src/pages/blog.astro src/pages/blog tests/integration/posts.test.ts
git commit -m "feat: manage and publish Markdown posts"
~~~

### Task 10: Add About page and site settings management

**Files:**
- Create: src/server/validation/about.ts
- Create: src/server/validation/settings.ts
- Create: src/pages/admin/about.astro
- Create: src/pages/admin/settings.astro
- Create: src/components/admin/RepeaterField.astro
- Create: src/pages/api/admin/about.ts
- Create: src/pages/api/admin/settings.ts
- Modify: src/pages/about.astro
- Modify: src/components/MainHead.astro
- Modify: src/components/Header.astro
- Modify: src/components/Footer.astro
- Create: tests/integration/about-settings.test.ts

- [ ] **Step 1: Write failing About/settings tests**

Assert singleton upsert behavior, email and URL validation, profile and social-link ordering, portrait upload/external source switching, default SEO fallback, and analytics JSON validation.

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/integration/about-settings.test.ts

Expected: FAIL because the endpoints do not exist.

- [ ] **Step 3: Implement schemas and transactional singleton updates**

About updates must replace profile and social-link ordered rows in one transaction. Settings updates must retain the current row on invalid analytics input. Only allow known analytics keys: google and baidu.

- [ ] **Step 4: Build the dedicated About editor**

Expose portrait source, portrait preview, name, role, intro, biography, email, SEO, profile items, and social links. RepeaterField supports add, delete, Move up, Move down, and drag ordering with stable generated client IDs.

- [ ] **Step 5: Build general settings and connect visitor components**

Settings contains site name, short name, canonical site URL, locale, homepage title/introduction, default SEO, and analytics IDs. Query it in MainHead, Header, Footer, and index.astro while preserving all existing markup and CSS hooks. MainHead emits only the fixed Google and Baidu analytics snippets for validated IDs; the CMS never stores or renders arbitrary script markup.

- [ ] **Step 6: Run tests and commit**

Run:

~~~powershell
pnpm test tests/integration/about-settings.test.ts
pnpm check
~~~

Expected: all About/settings tests pass.

~~~powershell
git add src/server/validation/about.ts src/server/validation/settings.ts src/pages/admin/about.astro src/pages/admin/settings.astro src/components/admin/RepeaterField.astro src/pages/api/admin/about.ts src/pages/api/admin/settings.ts src/pages/about.astro src/components/MainHead.astro src/components/Header.astro src/components/Footer.astro src/pages/index.astro tests/integration/about-settings.test.ts
git commit -m "feat: manage About page and site settings"
~~~

### Task 11: Package production deployment, persistence, and backup

**Files:**
- Create: Dockerfile
- Create: docker-compose.yml
- Create: .dockerignore
- Create: .env.example
- Create: scripts/backup.ts
- Modify: README.md
- Create: tests/unit/backup.test.ts

- [ ] **Step 1: Write a failing backup test**

Create a temporary SQLite database and upload tree, call createBackup(), and assert the output archive contains tink.sqlite, all upload files, and manifest.json with schemaVersion, createdAt, databaseBytes, and uploadFileCount.

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/unit/backup.test.ts

Expected: FAIL because scripts/backup.ts does not exist.

- [ ] **Step 3: Implement consistent backup creation**

Use SQLite VACUUM INTO to obtain a consistent database copy while the service is running. Archive the copy and uploads directory into backups/tink-{UTC timestamp}.zip, write manifest.json, then remove only the temporary copy created by this run. Refuse paths outside BACKUP_ROOT.

- [ ] **Step 4: Add container configuration**

Use a multi-stage Node 22 Alpine image with pnpm via Corepack. Install Sharp and better-sqlite3 build dependencies only in the build stage. Run the generated standalone server as a non-root user. docker-compose.yml mounts ./data at /app/data and ./backups at /app/backups, maps port 4321, sets restart: unless-stopped, and reads .env.

.env.example must define:

~~~dotenv
HOST=0.0.0.0
PORT=4321
DATABASE_PATH=/app/data/tink.sqlite
UPLOAD_ROOT=/app/data/uploads
BACKUP_ROOT=/app/backups
ADMIN_USERNAME=owner
ADMIN_PASSWORD_HASH=
PUBLIC_SITE_URL=https://photos.example.com
NODE_ENV=production
~~~

- [ ] **Step 5: Document exact deployment and recovery**

README instructions must cover generating ADMIN_PASSWORD_HASH, creating data/backups directories, starting with docker compose up -d --build, running migrations/import inside the container, reverse-proxy HTTPS requirements, creating a backup, restoring into a stopped service, and file ownership.

- [ ] **Step 6: Verify the production image and commit**

Run:

~~~powershell
pnpm test tests/unit/backup.test.ts
docker compose config
docker compose build
~~~

Expected: tests pass, compose configuration is valid, and the image builds.

~~~powershell
git add Dockerfile docker-compose.yml .dockerignore .env.example scripts/backup.ts README.md tests/unit/backup.test.ts
git commit -m "feat: package VPS deployment and backups"
~~~

### Task 12: Complete end-to-end, responsive, visual, and failure-path verification

**Files:**
- Create: playwright.config.ts
- Create: tests/e2e/auth.spec.ts
- Create: tests/e2e/content-management.spec.ts
- Create: tests/e2e/visitor.spec.ts
- Create: tests/e2e/responsive.spec.ts
- Create: tests/e2e/fixtures/*
- Modify: package.json

- [ ] **Step 1: Add isolated E2E server configuration**

Configure Playwright webServer to run migrations, import fixture content, and start Astro on an isolated database/upload root. Use Chromium desktop at 1440x1000 and mobile at 390x844. Store screenshots only for failures and explicit visual assertions.

- [ ] **Step 2: Implement login and authorization coverage**

Test invalid login, throttling, successful login, direct unauthenticated admin redirect, unauthenticated API 401, logout, expired cookie, and session cookie attributes.

- [ ] **Step 3: Implement the complete administrator workflow**

Through the real browser:

1. Create a category.
2. Create and publish an album.
3. Upload two local images and add one external image.
4. Reorder images, choose a manual layout, set a cover, and publish.
5. Create and publish a Markdown post.
6. Edit About content and reorder social links.
7. Edit the homepage title.
8. Verify every change on visitor pages.
9. Delete the external image, album, and category with confirmations.

- [ ] **Step 4: Add visitor visual and responsive assertions**

Capture current upstream reference screenshots before database wiring and compare final desktop/mobile screenshots for home, category, album, blog, post, About, menu-open, dark theme, and 404 states. Use a small threshold only for expected dynamic image rendering. Assert no horizontal overflow, overlapping text, missing images, or layout shift after image load.

- [ ] **Step 5: Exercise failure paths**

Test a rejected oversized upload, unsupported file type, duplicate slug, failed external image, attempted non-empty category deletion, invalid analytics JSON, and database write failure. Assert the form retains user input and presents a Chinese actionable message.

- [ ] **Step 6: Run the full release gate**

Run:

~~~powershell
pnpm test
pnpm check
pnpm build
pnpm test:e2e
docker compose config
~~~

Expected: every command exits 0; Playwright reports all desktop and mobile projects passing; no unexpected browser console errors occur.

- [ ] **Step 7: Inspect the final working tree and commit**

Run: git status --short

Expected: only intentional test artifacts ignored by .gitignore; no generated database, uploads, backups, or temporary files staged.

~~~powershell
git add package.json pnpm-lock.yaml playwright.config.ts tests/e2e
git commit -m "test: verify complete photography CMS workflows"
~~~

## Final acceptance checklist

- [ ] All supplied visitor pages, class names, animation hooks, theme behavior, and public assets remain present.
- [ ] All legacy categories, photos, articles, About data, and site metadata are imported exactly once.
- [ ] Existing public paths resolve after migration.
- [ ] Published data appears immediately; drafts never leak to unauthenticated visitors.
- [ ] Local uploads produce originals, thumbnails, WebP, and AVIF variants in persistent storage.
- [ ] External images render directly and never trigger a server-side fetch.
- [ ] Single-admin authentication, login throttling, session expiry, and write-route guards pass.
- [ ] Category, album, photo, post, About, and settings workflows pass on desktop and mobile.
- [ ] Production build, Docker image, backup, and documented restore procedure are verified.

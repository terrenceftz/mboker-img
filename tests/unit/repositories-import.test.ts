import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { importLegacyContent } from '../../scripts/import-legacy-content';
import { readGalleryModule } from '../../scripts/legacy/read-gallery-module';
import { createTestDatabase } from '../helpers/database';
import {
  createCategory,
  deleteCategory,
  listCategoriesPublished,
  reorderCategories,
} from '../../src/server/repositories/categories';
import {
  createAlbum,
  listAlbumsPublished,
} from '../../src/server/repositories/albums';
import { createUploadedPhoto, listPhotos, reorderPhotos } from '../../src/server/repositories/photos';
import { RepositoryError } from '../../src/server/repositories/shared';

const databases: Array<Awaited<ReturnType<typeof createTestDatabase>>> = [];

async function openDatabase() {
  const database = await createTestDatabase();
  databases.push(database);
  return database;
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

describe('published repositories', () => {
  it('filters unpublished parents and children and keeps sortOrder/id ordering stable', async () => {
    const { db } = await openDatabase();
    const visible = createCategory(db, { title: 'Visible', slug: 'visible', status: 'published', sortOrder: 1 });
    const draftParent = createCategory(db, { title: 'Draft', slug: 'draft-parent', status: 'draft', sortOrder: 0 });
    const sameOrder = createCategory(db, { title: 'Second', slug: 'second', status: 'published', sortOrder: 1 });

    createAlbum(db, { categoryId: visible.id, title: 'Draft child', slug: 'draft-child', status: 'draft', sortOrder: 0 });
    createAlbum(db, { categoryId: draftParent.id, title: 'Hidden parent', slug: 'hidden-parent', status: 'published', sortOrder: 0 });
    const published = createAlbum(db, { categoryId: visible.id, title: 'Published', slug: 'published', status: 'published', sortOrder: 1 });

    expect(listCategoriesPublished(db).map((row) => row.id)).toEqual([visible.id, sameOrder.id]);
    expect(listAlbumsPublished(db).map((row) => row.id)).toEqual([published.id]);
    expect(listAlbumsPublished(db)[0]?.category.slug).toBe('visible');
  });
});

describe('repository errors', () => {
  it('returns stable typed codes for conflicts, non-empty categories, and invalid orders', async () => {
    const { db } = await openDatabase();
    const category = createCategory(db, { title: 'One', slug: 'same' });
    expect(() => createCategory(db, { title: 'Two', slug: 'same' })).toThrowError(
      expect.objectContaining<Partial<RepositoryError>>({ code: 'SLUG_CONFLICT' }),
    );

    const album = createAlbum(db, { categoryId: category.id, title: 'Album', slug: 'album' });
    expect(() => deleteCategory(db, category.id)).toThrowError(
      expect.objectContaining<Partial<RepositoryError>>({ code: 'CATEGORY_NOT_EMPTY' }),
    );
    expect(() => reorderCategories(db, [])).toThrowError(
      expect.objectContaining<Partial<RepositoryError>>({ code: 'INVALID_ORDER' }),
    );

    const first = createUploadedPhoto(db, { albumId: album.id, originalUrl: '/one.jpg' });
    const second = createUploadedPhoto(db, { albumId: album.id, originalUrl: '/two.jpg' });
    expect(() => reorderPhotos(db, album.id, [first.id, first.id])).toThrowError(
      expect.objectContaining<Partial<RepositoryError>>({ code: 'INVALID_ORDER' }),
    );
    expect(listPhotos(db, album.id).map((photo) => photo.id)).toEqual([first.id, second.id]);
  });
});

describe('legacy gallery parser', () => {
  it('preserves imported source, metadata, and responsive layout without executing the module', async () => {
    const fixture = resolve('tests/fixtures/legacy-gallery.ts');
    const gallery = await readGalleryModule(fixture);

    expect(gallery.slug).toBe('fixture');
    expect(gallery.images[0]).toMatchObject({
      sourcePath: resolve('tests/fixtures/fixture-image.jpg'),
      alt: 'Fixture image alt',
      order: 7,
      layout: {
        cols: { default: '12', md: '8' },
        offset: { md: '2' },
        align: 'end',
        class: 'fixture-class',
        hasBackground: true,
        padding: '2rem',
      },
    });
  });
});

describe('legacy importer', () => {
  it('refuses populated content and imports an injected gallery through injected media processing', async () => {
    const firstDatabase = await openDatabase();
    createCategory(firstDatabase.db, { title: 'Existing', slug: 'existing' });
    await expect(importLegacyContent({ db: firstDatabase.db, galleries: [] })).rejects.toThrow(/not empty/i);

    const { db } = await openDatabase();
    const gallery = await readGalleryModule(resolve('tests/fixtures/legacy-gallery.ts'));
    const result = await importLegacyContent({
      db,
      galleries: [gallery],
      importPosts: false,
      mediaImporter: async (sourcePath, albumId) => ({
        originalUrl: `/media/albums/${albumId}/fixture/original.jpg`,
        thumbnailUrl: `/media/albums/${albumId}/fixture/thumbnail.webp`,
        width: 1200,
        height: 800,
        variants: { webp: [{ width: 960, url: `${sourcePath}.webp` }], avif: [] },
        automaticLayout: 'standard',
      }),
    });

    expect(result).toMatchObject({ categories: 1, albums: 1, photos: 1 });
    expect(listAlbumsPublished(db)[0]).toMatchObject({ slug: 'fixture', legacyPath: '/collection/fixture' });
    expect(listPhotos(db, listAlbumsPublished(db)[0]!.id)[0]).toMatchObject({
      alt: 'Fixture image alt',
      hasBackground: true,
      padding: '2rem',
      sortOrder: 7,
      layoutJson: {
        cols: { default: '12', md: '8' },
        offset: { md: '2' },
        align: 'end',
        class: 'fixture-class',
        hasBackground: true,
        padding: '2rem',
      },
    });
  });
});

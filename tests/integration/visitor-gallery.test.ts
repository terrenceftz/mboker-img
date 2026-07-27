import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { photos } from '../../src/server/db/schema';
import {
  findPublishedAlbumByLegacyPath,
  getPublishedAlbumView,
  getPublishedCategoryView,
} from '../../src/server/repositories/visitor-gallery';
import { RepositoryError } from '../../src/server/repositories/shared';
import { createTestDatabase } from '../helpers/database';

describe('visitor gallery queries', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('returns only published albums and keeps configured ordering', async () => {
    const category = await testDatabase.seedCategory({
      title: 'Travel',
      slug: 'travel',
      status: 'published',
    });
    const later = await testDatabase.seedAlbum(category.id, {
      title: 'Coast',
      slug: 'coast',
      status: 'published',
      sortOrder: 2,
    });
    const earlier = await testDatabase.seedAlbum(category.id, {
      title: 'Mountains',
      slug: 'mountains',
      status: 'published',
      sortOrder: 1,
    });
    await testDatabase.seedAlbum(category.id, {
      title: 'Draft',
      slug: 'draft',
      status: 'draft',
      sortOrder: 0,
    });
    testDatabase.db.insert(photos).values([
      { albumId: earlier.id, originalUrl: 'https://example.com/second.jpg', sourceType: 'external', sortOrder: 2 },
      { albumId: earlier.id, originalUrl: '/media/albums/1/a/original.jpg', sourceType: 'upload', sortOrder: 1,
        variantsJson: { webp: [{ width: 960, url: '/media/albums/1/a/image-960.webp' }], avif: [{ width: 960, url: '/media/albums/1/a/image-960.avif' }] } },
    ]).run();

    const view = getPublishedCategoryView(testDatabase.db, 'travel');

    expect(view.albums.map((album) => album.id)).toEqual([earlier.id, later.id]);
    expect(view.albums[0]?.photos.map((photo) => photo.sortOrder)).toEqual([1, 2]);
    expect(view.albums[0]?.photos[0]?.variantsJson.webp?.[0]?.width).toBe(960);
  });

  it('requires both category and album to be published', async () => {
    const category = await testDatabase.seedCategory({ slug: 'hidden', status: 'draft' });
    await testDatabase.seedAlbum(category.id, { slug: 'visible-album', status: 'published' });

    expect(() => getPublishedAlbumView(testDatabase.db, 'hidden', 'visible-album')).toThrowError(
      RepositoryError,
    );
  });

  it('resolves published legacy paths and ignores draft targets', async () => {
    const category = await testDatabase.seedCategory({ slug: 'legacy', status: 'published' });
    const published = await testDatabase.seedAlbum(category.id, {
      slug: 'published',
      status: 'published',
      legacyPath: '/collection/old-gallery',
    });
    await testDatabase.seedAlbum(category.id, {
      slug: 'draft',
      status: 'draft',
      legacyPath: '/collection/draft-gallery',
    });

    expect(findPublishedAlbumByLegacyPath(testDatabase.db, '/collection/old-gallery')?.id).toBe(published.id);
    expect(findPublishedAlbumByLegacyPath(testDatabase.db, '/collection/draft-gallery')).toBeUndefined();
  });
});

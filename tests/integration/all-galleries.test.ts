import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { albums, photos } from '../../src/server/db/schema';
import { getPublishedGalleryIndex } from '../../src/server/repositories/visitor-gallery';
import { createTestDatabase } from '../helpers/database';

describe('published gallery index', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('groups published albums by published category order', async () => {
    const laterCategory = await testDatabase.seedCategory({
      title: '自然', slug: 'nature-index', status: 'published', sortOrder: 2,
    });
    const firstCategory = await testDatabase.seedCategory({
      title: '城市', slug: 'city-index', status: 'published', sortOrder: 1,
    });
    const draftCategory = await testDatabase.seedCategory({
      title: '隐藏', slug: 'hidden-index', status: 'draft', sortOrder: 0,
    });
    await testDatabase.seedCategory({
      title: '空分类', slug: 'empty-index', status: 'published', sortOrder: 3,
    });

    const natureLater = await testDatabase.seedAlbum(laterCategory.id, {
      title: '林间', slug: 'forest-index', status: 'published', sortOrder: 2,
    });
    const natureFirst = await testDatabase.seedAlbum(laterCategory.id, {
      title: '山野', slug: 'mountain-index', status: 'published', sortOrder: 1,
    });
    await testDatabase.seedAlbum(laterCategory.id, {
      title: '未发布', slug: 'draft-index', status: 'draft', sortOrder: 0,
    });
    const city = await testDatabase.seedAlbum(firstCategory.id, {
      title: '街道', slug: 'street-index', status: 'published', sortOrder: 0,
    });
    await testDatabase.seedAlbum(draftCategory.id, {
      title: '不可见图集', slug: 'hidden-album-index', status: 'published', sortOrder: 0,
    });

    const result = getPublishedGalleryIndex(testDatabase.db);

    expect(result.map((group) => group.category.id)).toEqual([firstCategory.id, laterCategory.id]);
    expect(result[0]?.albums.map((album) => album.id)).toEqual([city.id]);
    expect(result[1]?.albums.map((album) => album.id)).toEqual([natureFirst.id, natureLater.id]);
  });

  it('uses the configured cover, then first photo, then null', async () => {
    const category = await testDatabase.seedCategory({ status: 'published' });
    const configured = await testDatabase.seedAlbum(category.id, { status: 'published', sortOrder: 0 });
    const fallback = await testDatabase.seedAlbum(category.id, { status: 'published', sortOrder: 1 });
    const empty = await testDatabase.seedAlbum(category.id, { status: 'published', sortOrder: 2 });
    const configuredPhotos = testDatabase.db.insert(photos).values([
      { albumId: configured.id, originalUrl: '/configured-first.jpg', sortOrder: 0 },
      { albumId: configured.id, originalUrl: '/configured-cover.jpg', sortOrder: 1 },
    ]).returning().all();
    const fallbackPhoto = testDatabase.db.insert(photos).values({
      albumId: fallback.id,
      originalUrl: '/fallback-cover.jpg',
    }).returning().get();
    testDatabase.db.update(albums).set({ coverPhotoId: configuredPhotos[1]!.id })
      .where(eq(albums.id, configured.id)).run();

    const result = getPublishedGalleryIndex(testDatabase.db)[0]!.albums;

    expect(result.find((album) => album.id === configured.id)?.cover?.originalUrl).toBe('/configured-cover.jpg');
    expect(result.find((album) => album.id === fallback.id)?.cover?.id).toBe(fallbackPhoto.id);
    expect(result.find((album) => album.id === empty.id)?.cover).toBeNull();
  });
});

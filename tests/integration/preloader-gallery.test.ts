import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { photos } from '../../src/server/db/schema';
import { listPublishedPreloaderImageUrls } from '../../src/server/repositories/preloader';
import { createTestDatabase } from '../helpers/database';

describe('published preloader gallery', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('returns optimized URLs only from published albums in published categories', async () => {
    const publishedCategory = await testDatabase.seedCategory({ status: 'published' });
    const draftCategory = await testDatabase.seedCategory({ status: 'draft' });
    const publishedAlbum = await testDatabase.seedAlbum(publishedCategory.id, { status: 'published' });
    const draftAlbum = await testDatabase.seedAlbum(publishedCategory.id, { status: 'draft' });
    const albumInDraftCategory = await testDatabase.seedAlbum(draftCategory.id, { status: 'published' });

    testDatabase.db.insert(photos).values([
      {
        albumId: publishedAlbum.id,
        originalUrl: '/media/published-original.jpg',
        thumbnailUrl: '/media/published-thumb.webp',
      },
      {
        albumId: publishedAlbum.id,
        sourceType: 'external',
        originalUrl: 'https://images.example.com/external.jpg',
      },
      { albumId: draftAlbum.id, originalUrl: '/media/draft-album.jpg' },
      { albumId: albumInDraftCategory.id, originalUrl: '/media/draft-category.jpg' },
    ]).run();

    expect(listPublishedPreloaderImageUrls(testDatabase.db)).toEqual([
      '/media/published-thumb.webp',
      'https://images.example.com/external.jpg',
    ]);
  });
});

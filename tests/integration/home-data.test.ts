import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { photos } from '../../src/server/db/schema';
import { getHomeData } from '../../src/server/repositories/home';
import { createTestDatabase } from '../helpers/database';

describe('homepage gallery data', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('returns only published albums explicitly selected for the homepage', async () => {
    const category = await testDatabase.seedCategory({ status: 'published' });
    const selected = await testDatabase.seedAlbum(category.id, {
      title: '首页图集',
      status: 'published',
      featured: true,
    });
    const notSelected = await testDatabase.seedAlbum(category.id, {
      status: 'published',
      featured: false,
    });
    const draft = await testDatabase.seedAlbum(category.id, {
      status: 'draft',
      featured: true,
    });
    testDatabase.db.insert(photos).values([
      { albumId: selected.id, originalUrl: '/selected.jpg' },
      { albumId: notSelected.id, originalUrl: '/not-selected.jpg' },
      { albumId: draft.id, originalUrl: '/draft.jpg' },
    ]).run();

    const result = getHomeData(testDatabase.db);

    expect(result.featuredAlbums.map((album) => album.id)).toEqual([selected.id]);
    expect(result.featuredAlbums[0]?.cover?.originalUrl).toBe('/selected.jpg');
  });

  it('excludes selected albums whose category is not published', async () => {
    const category = await testDatabase.seedCategory({ status: 'draft' });
    await testDatabase.seedAlbum(category.id, { status: 'published', featured: true });

    expect(getHomeData(testDatabase.db).featuredAlbums).toEqual([]);
  });
});

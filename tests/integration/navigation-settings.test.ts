import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { photos } from '../../src/server/db/schema';
import { createTestDatabase } from '../helpers/database';

describe('gallery navigation configuration', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('validates unique album ids', async () => {
    const validation = await import('../../src/server/validation/navigation').catch(() => null);
    expect(validation).not.toBeNull();
    if (!validation) return;

    expect(validation.navigationInput.parse({ albumIds: [2, 1] })).toEqual({ albumIds: [2, 1] });
    expect(validation.navigationInput.safeParse({ albumIds: [1, 1] }).success).toBe(false);
  });

  it('preserves fallback behavior and resolves configured published albums in order', async () => {
    const repository = await import('../../src/server/repositories/navigation').catch(() => null);
    expect(repository).not.toBeNull();
    if (!repository) return;

    const nature = await testDatabase.seedCategory({ title: '自然', slug: 'nature-nav', status: 'published', sortOrder: 0 });
    const city = await testDatabase.seedCategory({ title: '城市', slug: 'city-nav', status: 'published', sortOrder: 1 });
    const hidden = await testDatabase.seedCategory({ title: '隐藏', slug: 'hidden-nav', status: 'draft', sortOrder: 2 });
    const natureFirst = await testDatabase.seedAlbum(nature.id, { title: '山野', slug: 'mountains-nav', status: 'published', sortOrder: 0 });
    await testDatabase.seedAlbum(nature.id, { title: '草稿图集', slug: 'draft-nav', status: 'draft', sortOrder: 1 });
    const natureSecond = await testDatabase.seedAlbum(nature.id, { title: '阿勒泰', slug: 'altay-nav', status: 'published', sortOrder: 2 });
    const cityFirst = await testDatabase.seedAlbum(city.id, { title: '街道', slug: 'street-nav', status: 'published', sortOrder: 0 });
    const hiddenAlbum = await testDatabase.seedAlbum(hidden.id, { title: '关闭分类图集', slug: 'hidden-album-nav', status: 'published' });
    const cover = testDatabase.db.insert(photos).values({
      albumId: natureSecond.id,
      originalUrl: '/altay-cover.jpg',
      thumbnailUrl: '/altay-thumb.jpg',
    }).returning().get();

    expect(repository.resolveNavigationAlbums(testDatabase.db, null).map((item: any) => item.id)).toEqual([
      natureFirst.id,
      cityFirst.id,
    ]);
    expect(repository.resolveNavigationAlbums(testDatabase.db, {
      version: 1,
      albumIds: [cityFirst.id, hiddenAlbum.id, 999_999, natureSecond.id],
    }).map((item: any) => item.id)).toEqual([cityFirst.id, natureSecond.id]);
    expect(repository.resolveNavigationAlbums(testDatabase.db, {
      version: 1,
      albumIds: [natureSecond.id],
    })[0]).toMatchObject({
      title: '阿勒泰',
      href: '/collection/nature-nav/altay-nav',
      coverUrl: cover.thumbnailUrl,
    });
  });

  it('filters only deleted ids while retaining existing draft selections', async () => {
    const repository = await import('../../src/server/repositories/navigation').catch(() => null);
    expect(repository).not.toBeNull();
    if (!repository) return;

    const category = await testDatabase.seedCategory({ status: 'published' });
    const published = await testDatabase.seedAlbum(category.id, { status: 'published' });
    const draft = await testDatabase.seedAlbum(category.id, { status: 'draft' });

    expect(repository.filterExistingAlbumIds(testDatabase.db, [draft.id, 999_999, published.id])).toEqual([
      draft.id,
      published.id,
    ]);
  });
});

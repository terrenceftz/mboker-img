import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiState = vi.hoisted(() => ({ database: undefined as any }));

vi.mock('../../src/server/db/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/db/client')>()),
  getDatabase: () => apiState.database.db,
}));

vi.mock('../../src/server/auth/session', () => ({
  readSession: (_db: unknown, token: string) => token === 'valid-session' ? { id: 1 } : undefined,
}));

import { backfillAltaySpecial } from '../../scripts/backfill-altay-special';
import { albums, photos, type SpecialLayoutDocument } from '../../src/server/db/schema';
import { getAlbumById, saveSpecialLayout } from '../../src/server/repositories/albums';
import { RepositoryError } from '../../src/server/repositories/shared';
import { resolveSpecialLayout } from '../../src/server/special-layout/resolve';
import { createTestDatabase } from '../helpers/database';
import { GET as getSpecialLayout, PATCH as patchSpecialLayout } from '../../src/pages/api/admin/albums/[id]/special';

function apiContext(
  method: string,
  albumId: number,
  body?: unknown,
  authenticated = true,
) {
  const url = new URL(`http://localhost/api/admin/albums/${albumId}/special`);
  return {
    request: new Request(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    params: { id: String(albumId) },
    cookies: { get: () => authenticated ? { value: 'valid-session' } : undefined },
  } as any;
}

describe('special album layouts', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    apiState.database = testDatabase;
  });

  afterEach(async () => {
    await testDatabase.close();
    apiState.database = undefined;
  });

  it('saves owned photo references and rejects photos owned by another album', async () => {
    const category = await testDatabase.seedCategory();
    const album = await testDatabase.seedAlbum(category.id);
    const otherAlbum = await testDatabase.seedAlbum(category.id);
    const ownPhoto = testDatabase.db.insert(photos).values({
      albumId: album.id,
      originalUrl: '/own.jpg',
    }).returning().get();
    const foreignPhoto = testDatabase.db.insert(photos).values({
      albumId: otherAlbum.id,
      originalUrl: '/foreign.jpg',
    }).returning().get();
    const layout: SpecialLayoutDocument = {
      version: 1,
      blocks: [{ id: 'hero', type: 'image', photoId: ownPhoto.id }],
    };

    const saved = saveSpecialLayout(testDatabase.db, album.id, { isSpecial: true, layout });

    expect(saved).toMatchObject({ isSpecial: true, specialLayoutJson: layout });
    expect(() => saveSpecialLayout(testDatabase.db, album.id, {
      isSpecial: true,
      layout: { version: 1, blocks: [{ id: 'foreign', type: 'image', photoId: foreignPhoto.id }] },
    })).toThrowError(expect.objectContaining<Partial<RepositoryError>>({ code: 'PHOTO_NOT_IN_ALBUM' }));
  });

  it('resolves missing image references without breaking remaining content', () => {
    const available = {
      id: 1,
      albumId: 2,
      originalUrl: '/available.jpg',
    } as typeof photos.$inferSelect;
    const layout: SpecialLayoutDocument = {
      version: 1,
      blocks: [
        { id: 'missing', type: 'image', photoId: 99 },
        {
          id: 'split',
          type: 'split',
          direction: 'image-text',
          ratio: '1:1',
          verticalAlign: 'start',
          photoId: 98,
          markdown: 'Readable text',
        },
        { id: 'pair', type: 'twoImages', ratio: '1:1', leftPhotoId: available.id, rightPhotoId: 97 },
      ],
    };

    const resolved = resolveSpecialLayout(layout, [available]);

    expect(resolved[0]).toMatchObject({ type: 'image', photo: null });
    expect(resolved[1]).toMatchObject({ type: 'split', photo: null, markdown: 'Readable text' });
    expect(resolved[2]).toMatchObject({ type: 'twoImages', leftPhoto: available, rightPhoto: null });
  });

  it('backfills Altay once and preserves later administrator edits', async () => {
    const category = await testDatabase.seedCategory({ slug: 'altay' });
    const album = await testDatabase.seedAlbum(category.id, {
      slug: 'altay',
      seoTitle: '阿勒泰摄影作品集 | Tink Photo',
    });
    testDatabase.db.insert(photos).values([
      { albumId: album.id, originalUrl: '/first.jpg', sortOrder: 0 },
      { albumId: album.id, originalUrl: '/second.jpg', sortOrder: 1 },
      { albumId: album.id, originalUrl: '/third.jpg', sortOrder: 2 },
    ]).run();

    const changed = backfillAltaySpecial(testDatabase.db);
    const initial = getAlbumById(testDatabase.db, album.id);

    expect(changed).toBe(true);
    expect(initial.isSpecial).toBe(true);
    expect(initial.seoTitle).toBe('阿勒泰摄影作品集 | Mboker Img');
    expect(initial.specialLayoutJson.blocks.map((block) => block.type)).toEqual(['split', 'image', 'image']);
    expect(initial.specialLayoutJson.blocks[0]).toMatchObject({
      type: 'split',
      direction: 'image-text',
      ratio: '3:2',
      markdown: expect.stringContaining('阿勒泰地区西部'),
    });

    const customized: SpecialLayoutDocument = {
      version: 1,
      blocks: [{ id: 'custom', type: 'markdown', markdown: 'Keep this edit' }],
    };
    testDatabase.db.update(albums).set({ specialLayoutJson: customized }).run();

    expect(backfillAltaySpecial(testDatabase.db)).toBe(false);
    expect(getAlbumById(testDatabase.db, album.id).specialLayoutJson).toEqual(customized);
  });

  it('protects and validates the special layout API', async () => {
    const category = await testDatabase.seedCategory();
    const album = await testDatabase.seedAlbum(category.id);

    const unauthorized = await patchSpecialLayout(apiContext('PATCH', album.id, {
      isSpecial: true,
      layout: { version: 1, blocks: [] },
    }, false));
    expect(unauthorized.status).toBe(401);

    const invalid = await patchSpecialLayout(apiContext('PATCH', album.id, {
      isSpecial: true,
      layout: { version: 1, blocks: [{ id: 'bad', type: 'image', photoId: 0 }] },
    }));
    expect(invalid.status).toBe(422);
  });

  it('returns and saves normalized special layout API data', async () => {
    const category = await testDatabase.seedCategory();
    const album = await testDatabase.seedAlbum(category.id);
    const photo = testDatabase.db.insert(photos).values({
      albumId: album.id,
      originalUrl: '/api-photo.jpg',
    }).returning().get();
    const layout: SpecialLayoutDocument = {
      version: 1,
      blocks: [{ id: 'api-hero', type: 'image', photoId: photo.id }],
    };

    const saved = await patchSpecialLayout(apiContext('PATCH', album.id, { isSpecial: true, layout }));
    expect(saved.status).toBe(200);
    await expect(saved.json()).resolves.toMatchObject({ data: { isSpecial: true, specialLayoutJson: layout } });

    const loaded = await getSpecialLayout(apiContext('GET', album.id));
    await expect(loaded.json()).resolves.toMatchObject({
      data: { album: { id: album.id, isSpecial: true }, photos: [{ id: photo.id }] },
    });
  });

  it('rejects cross-album photos through the special layout API', async () => {
    const category = await testDatabase.seedCategory();
    const album = await testDatabase.seedAlbum(category.id);
    const other = await testDatabase.seedAlbum(category.id);
    const foreign = testDatabase.db.insert(photos).values({
      albumId: other.id,
      originalUrl: '/foreign-api.jpg',
    }).returning().get();

    const response = await patchSpecialLayout(apiContext('PATCH', album.id, {
      isSpecial: true,
      layout: { version: 1, blocks: [{ id: 'foreign', type: 'image', photoId: foreign.id }] },
    }));

    expect(response.status).toBe(409);
  });
});

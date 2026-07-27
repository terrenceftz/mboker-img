import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { backfillAltaySpecial } from '../../scripts/backfill-altay-special';
import { albums, photos, type SpecialLayoutDocument } from '../../src/server/db/schema';
import { getAlbumById, saveSpecialLayout } from '../../src/server/repositories/albums';
import { RepositoryError } from '../../src/server/repositories/shared';
import { resolveSpecialLayout } from '../../src/server/special-layout/resolve';
import { createTestDatabase } from '../helpers/database';

describe('special album layouts', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
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
    const album = await testDatabase.seedAlbum(category.id, { slug: 'altay' });
    testDatabase.db.insert(photos).values([
      { albumId: album.id, originalUrl: '/first.jpg', sortOrder: 0 },
      { albumId: album.id, originalUrl: '/second.jpg', sortOrder: 1 },
      { albumId: album.id, originalUrl: '/third.jpg', sortOrder: 2 },
    ]).run();

    const changed = backfillAltaySpecial(testDatabase.db);
    const initial = getAlbumById(testDatabase.db, album.id);

    expect(changed).toBe(true);
    expect(initial.isSpecial).toBe(true);
    expect(initial.specialLayoutJson.blocks.map((block) => block.type)).toEqual(['split', 'image', 'image']);
    expect(initial.specialLayoutJson.blocks[0]).toMatchObject({
      type: 'split',
      direction: 'image-text',
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
});

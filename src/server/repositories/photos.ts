import { asc, eq } from 'drizzle-orm';

import { photos } from '../db/schema';
import { assertCompleteOrder, type CmsDatabase, notFound, now } from './shared';

type NewPhoto = typeof photos.$inferInsert;
type PhotoChanges = Partial<
  Pick<NewPhoto, 'alt' | 'layoutPreset' | 'align' | 'hasBackground' | 'padding' | 'layoutJson'>
>;
type PhotoMedia = Pick<
  NewPhoto,
  'albumId' | 'originalUrl' | 'variantsJson' | 'thumbnailUrl' | 'width' | 'height' | 'alt' | 'sortOrder' | 'layoutPreset' | 'align' | 'hasBackground' | 'padding' | 'layoutJson'
>;

export function listPhotos(db: CmsDatabase, albumId: number) {
  return db
    .select()
    .from(photos)
    .where(eq(photos.albumId, albumId))
    .orderBy(asc(photos.sortOrder), asc(photos.id))
    .all();
}

export function getPhotoById(db: CmsDatabase, id: number) {
  return db.select().from(photos).where(eq(photos.id, id)).get() ?? notFound('Photo');
}

export function createUploadedPhoto(db: CmsDatabase, values: PhotoMedia) {
  return db.insert(photos).values({ ...values, sourceType: 'upload' }).returning().get();
}

export function createExternalPhoto(db: CmsDatabase, values: PhotoMedia) {
  return db.insert(photos).values({ ...values, sourceType: 'external' }).returning().get();
}

export function updatePhoto(db: CmsDatabase, id: number, values: PhotoChanges) {
  const photo = db
    .update(photos)
    .set({ ...values, updatedAt: now() })
    .where(eq(photos.id, id))
    .returning()
    .get();
  return photo ?? notFound('Photo');
}

export function reorderPhotos(db: CmsDatabase, albumId: number, ids: number[]) {
  return db.transaction((tx: CmsDatabase) => {
    const actualIds = tx
      .select({ id: photos.id })
      .from(photos)
      .where(eq(photos.albumId, albumId))
      .all()
      .map((row) => row.id);
    assertCompleteOrder(actualIds, ids);
    const updatedAt = now();
    ids.forEach((id, sortOrder) => {
      tx.update(photos).set({ sortOrder, updatedAt }).where(eq(photos.id, id)).run();
    });
    return listPhotos(tx, albumId);
  });
}

export function deletePhoto(db: CmsDatabase, id: number) {
  const photo = db.delete(photos).where(eq(photos.id, id)).returning().get();
  return photo ?? notFound('Photo');
}

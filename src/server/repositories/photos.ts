import { asc, eq, inArray } from 'drizzle-orm';

import { albums, photos, type SpecialLayoutBlock } from '../db/schema';
import { assertCompleteOrder, type CmsDatabase, notFound, now, RepositoryError } from './shared';

type NewPhoto = typeof photos.$inferInsert;
type PhotoChanges = Partial<
  Pick<NewPhoto, 'alt' | 'layoutPreset' | 'align' | 'hasBackground' | 'padding' | 'layoutJson'>
> & {
  pairWithNext?: boolean;
  pairRatio?: '1:1' | '2:3' | '3:2';
  verticalAlign?: 'start' | 'center' | 'end';
};
type PhotoMedia = Pick<
  NewPhoto,
  'albumId' | 'originalUrl' | 'variantsJson' | 'thumbnailUrl' | 'width' | 'height' | 'alt' | 'sortOrder' | 'layoutPreset' | 'align' | 'hasBackground' | 'padding' | 'layoutJson'
>;
type PhotoMediaChanges = Pick<
  NewPhoto,
  'sourceType' | 'originalUrl' | 'variantsJson' | 'thumbnailUrl' | 'width' | 'height' | 'layoutPreset'
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
  const current = getPhotoById(db, id);
  const { pairWithNext, pairRatio, verticalAlign, layoutJson: incomingLayout, ...columnValues } = values;
  const layoutJson = { ...(current.layoutJson ?? {}), ...(incomingLayout ?? {}) };
  delete layoutJson.align;
  delete layoutJson.hasBackground;
  delete layoutJson.padding;
  if (values.layoutPreset && values.layoutPreset !== current.layoutPreset) {
    delete layoutJson.cols;
    delete layoutJson.offset;
    delete layoutJson.class;
  }
  if (pairWithNext === false) {
    delete layoutJson.pairWithNext;
    delete layoutJson.pairRatio;
  } else if (pairWithNext === true) {
    layoutJson.pairWithNext = true;
    layoutJson.pairRatio = pairRatio ?? layoutJson.pairRatio ?? '1:1';
  } else if (pairRatio && layoutJson.pairWithNext) {
    layoutJson.pairRatio = pairRatio;
  }
  if (verticalAlign) layoutJson.verticalAlign = verticalAlign;
  const photo = db
    .update(photos)
    .set({ ...columnValues, layoutJson, updatedAt: now() })
    .where(eq(photos.id, id))
    .returning()
    .get();
  return photo ?? notFound('Photo');
}

export function countSpecialLayoutReferences(db: CmsDatabase, id: number) {
  const photo = getPhotoById(db, id);
  const album = db
    .select({ isSpecial: albums.isSpecial, layout: albums.specialLayoutJson })
    .from(albums)
    .where(eq(albums.id, photo.albumId))
    .get();
  if (!album?.isSpecial) return 0;

  const referencesPhoto = (block: SpecialLayoutBlock) => {
    if (block.type === 'image' || block.type === 'split') return block.photoId === id;
    if (block.type === 'twoImages') return block.leftPhotoId === id || block.rightPhotoId === id;
    return false;
  };
  return album.layout.blocks.filter(referencesPhoto).length;
}

export function updatePhotoLayoutsBatch(
  db: CmsDatabase,
  albumId: number,
  ids: number[],
  values: Pick<PhotoChanges, 'layoutPreset' | 'align' | 'hasBackground' | 'padding'>,
) {
  return db.transaction((tx: CmsDatabase) => {
    const uniqueIds = [...new Set(ids)];
    const selected = tx
      .select({ id: photos.id, albumId: photos.albumId })
      .from(photos)
      .where(inArray(photos.id, uniqueIds))
      .all();
    if (uniqueIds.length !== ids.length || selected.length !== uniqueIds.length || selected.some((photo) => photo.albumId !== albumId)) {
      throw new RepositoryError('PHOTO_NOT_IN_ALBUM', 'Batch layouts can only update photos from one album.');
    }
    return ids.map((id) => updatePhoto(tx, id, values));
  });
}

export function replacePhotoMedia(db: CmsDatabase, id: number, values: PhotoMediaChanges) {
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

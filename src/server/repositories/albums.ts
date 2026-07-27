import { and, asc, eq, inArray } from 'drizzle-orm';

import { albums, categories, photos, type SpecialLayoutDocument } from '../db/schema';
import { referencedPhotoIds } from '../special-layout/resolve';
import { assertCompleteOrder, type CmsDatabase, notFound, now, RepositoryError, withSlugConflict } from './shared';

type NewAlbum = typeof albums.$inferInsert;
type AlbumChanges = Partial<Omit<NewAlbum, 'id' | 'createdAt' | 'updatedAt'>>;

function albumSelection() {
  return { album: albums, category: categories };
}

function flatten(row: { album: typeof albums.$inferSelect; category: typeof categories.$inferSelect }) {
  return { ...row.album, category: row.category };
}

export function listAlbumsAdmin(db: CmsDatabase, categoryId?: number) {
  const query = db
    .select(albumSelection())
    .from(albums)
    .innerJoin(categories, eq(albums.categoryId, categories.id));
  const rows = categoryId === undefined ? query : query.where(eq(albums.categoryId, categoryId));
  return rows.orderBy(asc(albums.sortOrder), asc(albums.id)).all().map(flatten);
}

export function listAlbumsPublished(db: CmsDatabase, categoryId?: number) {
  const conditions = [eq(albums.status, 'published'), eq(categories.status, 'published')];
  if (categoryId !== undefined) conditions.push(eq(albums.categoryId, categoryId));
  return db
    .select(albumSelection())
    .from(albums)
    .innerJoin(categories, eq(albums.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(albums.sortOrder), asc(albums.id))
    .all()
    .map(flatten);
}

export function getAlbumById(db: CmsDatabase, id: number) {
  const row = db
    .select(albumSelection())
    .from(albums)
    .innerJoin(categories, eq(albums.categoryId, categories.id))
    .where(eq(albums.id, id))
    .get();
  return row ? flatten(row) : notFound('Album');
}

export function getAlbumBySlug(db: CmsDatabase, slug: string) {
  const row = db
    .select(albumSelection())
    .from(albums)
    .innerJoin(categories, eq(albums.categoryId, categories.id))
    .where(eq(albums.slug, slug))
    .get();
  return row ? flatten(row) : notFound('Album');
}

export function getPublishedAlbumBySlug(db: CmsDatabase, slug: string) {
  const album = getAlbumBySlug(db, slug);
  if (album.status !== 'published' || album.category.status !== 'published') return notFound('Album');
  return album;
}

export function createAlbum(db: CmsDatabase, values: NewAlbum) {
  return withSlugConflict(() => db.insert(albums).values(values).returning().get());
}

export function updateAlbum(db: CmsDatabase, id: number, values: AlbumChanges) {
  return withSlugConflict(() => {
    const album = db
      .update(albums)
      .set({ ...values, updatedAt: now() })
      .where(eq(albums.id, id))
      .returning()
      .get();
    return album ?? notFound('Album');
  });
}

export function saveSpecialLayout(
  db: CmsDatabase,
  id: number,
  values: { isSpecial: boolean; layout: SpecialLayoutDocument },
) {
  return db.transaction((tx: CmsDatabase) => {
    getAlbumById(tx, id);
    const referencedIds = referencedPhotoIds(values.layout);
    if (referencedIds.length > 0) {
      const referencedPhotos = tx
        .select({ id: photos.id, albumId: photos.albumId })
        .from(photos)
        .where(inArray(photos.id, referencedIds))
        .all();
      if (referencedPhotos.some((photo) => photo.albumId !== id)) {
        throw new RepositoryError('PHOTO_NOT_IN_ALBUM', 'Special layouts can only use photos from their album.');
      }
    }
    return updateAlbum(tx, id, {
      isSpecial: values.isSpecial,
      specialLayoutJson: values.layout,
    });
  });
}

export function reorderAlbums(db: CmsDatabase, categoryId: number, ids: number[]) {
  return db.transaction((tx: CmsDatabase) => {
    const actualIds = tx
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.categoryId, categoryId))
      .all()
      .map((row) => row.id);
    assertCompleteOrder(actualIds, ids);
    const updatedAt = now();
    ids.forEach((id, sortOrder) => {
      tx.update(albums).set({ sortOrder, updatedAt }).where(eq(albums.id, id)).run();
    });
    return listAlbumsAdmin(tx, categoryId);
  });
}

export function deleteAlbum(db: CmsDatabase, id: number) {
  const album = db.delete(albums).where(eq(albums.id, id)).returning().get();
  return album ?? notFound('Album');
}

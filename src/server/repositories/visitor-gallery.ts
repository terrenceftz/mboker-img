import { and, eq } from 'drizzle-orm';

import { albums, categories } from '../db/schema';
import { getPublishedCategoryBySlug } from './categories';
import { listAlbumsPublished } from './albums';
import { listPhotos } from './photos';
import { type CmsDatabase, notFound } from './shared';

function withPhotos(db: CmsDatabase, album: ReturnType<typeof listAlbumsPublished>[number]) {
  const albumPhotos = listPhotos(db, album.id);
  return {
    ...album,
    photos: albumPhotos,
    cover: albumPhotos.find((photo) => photo.id === album.coverPhotoId) ?? albumPhotos[0] ?? null,
  };
}

export function getPublishedCategoryView(db: CmsDatabase, categorySlug: string) {
  const category = getPublishedCategoryBySlug(db, categorySlug);
  const publishedAlbums = listAlbumsPublished(db, category.id).map((album) => withPhotos(db, album));
  return { category, albums: publishedAlbums };
}

export function getPublishedAlbumView(db: CmsDatabase, categorySlug: string, albumSlug: string) {
  const categoryView = getPublishedCategoryView(db, categorySlug);
  const index = categoryView.albums.findIndex((album) => album.slug === albumSlug);
  if (index < 0) return notFound('Album');
  return {
    category: categoryView.category,
    album: categoryView.albums[index]!,
    next: categoryView.albums[index + 1] ?? categoryView.albums[0] ?? null,
  };
}

export function findPublishedAlbumByLegacyPath(db: CmsDatabase, legacyPath: string) {
  const row = db
    .select({ album: albums, category: categories })
    .from(albums)
    .innerJoin(categories, eq(albums.categoryId, categories.id))
    .where(
      and(
        eq(albums.legacyPath, legacyPath),
        eq(albums.status, 'published'),
        eq(categories.status, 'published'),
      ),
    )
    .get();
  return row ? withPhotos(db, { ...row.album, category: row.category }) : undefined;
}

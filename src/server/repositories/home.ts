import { and, asc, count, eq, inArray } from 'drizzle-orm';

import { albums, categories, photos, posts } from '../db/schema';
import type { CmsDatabase } from './shared';

export function getHomeData(db: CmsDatabase) {
  const publishedCategoryIds = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.status, 'published'))
    .all()
    .map((row) => row.id);

  const categoryCount = publishedCategoryIds.length;
  const publishedAlbums = publishedCategoryIds.length
    ? db
        .select({ album: albums, category: categories })
        .from(albums)
        .innerJoin(categories, eq(albums.categoryId, categories.id))
        .where(and(eq(albums.status, 'published'), inArray(albums.categoryId, publishedCategoryIds)))
        .orderBy(asc(albums.sortOrder), asc(albums.id))
        .all()
    : [];
  const albumIds = publishedAlbums.map((row) => row.album.id);
  const photoCount = albumIds.length
    ? db.select({ value: count() }).from(photos).where(inArray(photos.albumId, albumIds)).get()!.value
    : 0;
  const postCount = db
    .select({ value: count() })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .get()!.value;

  const featuredAlbums = publishedAlbums
    .filter((row) => row.album.featured)
    .map((row) => {
      const albumPhotos = db
        .select()
        .from(photos)
        .where(eq(photos.albumId, row.album.id))
        .orderBy(asc(photos.sortOrder), asc(photos.id))
        .all();
      return {
        ...row.album,
        category: row.category,
        cover: albumPhotos.find((photo) => photo.id === row.album.coverPhotoId) ?? albumPhotos[0] ?? null,
        photos: albumPhotos,
        photoCount: albumPhotos.length,
      };
    });

  return { counts: { categories: categoryCount, albums: publishedAlbums.length, photos: photoCount, posts: postCount }, featuredAlbums };
}

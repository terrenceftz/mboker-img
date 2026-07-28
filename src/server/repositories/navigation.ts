import type { NavigationConfig } from '../db/schema';
import { listAlbumsAdmin, listAlbumsPublished } from './albums';
import { listCategoriesPublished } from './categories';
import { listPhotos } from './photos';
import type { CmsDatabase } from './shared';

type PublishedAlbum = ReturnType<typeof listAlbumsPublished>[number];

function toMenuItem(db: CmsDatabase, album: PublishedAlbum) {
  const albumPhotos = listPhotos(db, album.id);
  const cover = albumPhotos.find((photo) => photo.id === album.coverPhotoId) ?? albumPhotos[0];
  return {
    id: album.id,
    title: album.title,
    href: `/collection/${album.category.slug}/${album.slug}`,
    coverUrl: cover?.thumbnailUrl ?? cover?.originalUrl ?? '/menu/other.jpg',
    special: Boolean(album.isSpecial),
  };
}

export function resolveNavigationAlbums(db: CmsDatabase, config: NavigationConfig | null) {
  if (config === null) {
    return listCategoriesPublished(db).flatMap((category) => {
      const album = listAlbumsPublished(db, category.id)[0];
      return album ? [toMenuItem(db, album)] : [];
    });
  }

  const publishedById = new Map(listAlbumsPublished(db).map((album) => [album.id, album]));
  return config.albumIds.flatMap((id) => {
    const album = publishedById.get(id);
    return album ? [toMenuItem(db, album)] : [];
  });
}

export function filterExistingAlbumIds(db: CmsDatabase, ids: number[]) {
  const existing = new Set(listAlbumsAdmin(db).map((album) => album.id));
  return ids.filter((id) => existing.has(id));
}

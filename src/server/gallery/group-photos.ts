import type { StoredPhotoLayout } from '../db/schema';

export type GalleryPhotoGroup<T> =
  | { type: 'single'; photo: T }
  | { type: 'pair'; first: T; second: T };

export function groupGalleryPhotos<T extends { layoutJson?: StoredPhotoLayout }>(items: T[]): GalleryPhotoGroup<T>[] {
  const groups: GalleryPhotoGroup<T>[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const first = items[index]!;
    const second = items[index + 1];
    if (first.layoutJson?.pairWithNext && second) {
      groups.push({ type: 'pair', first, second });
      index += 1;
    } else {
      groups.push({ type: 'single', photo: first });
    }
  }
  return groups;
}

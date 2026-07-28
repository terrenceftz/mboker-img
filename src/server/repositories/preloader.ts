import { and, asc, eq } from 'drizzle-orm';

import { albums, categories, photos } from '../db/schema';
import type { CmsDatabase } from './shared';

const FALLBACK_IMAGE = '/hero-preloader.jpg';

export function listPublishedPreloaderImageUrls(db: CmsDatabase) {
  return db
    .select({ thumbnailUrl: photos.thumbnailUrl, originalUrl: photos.originalUrl })
    .from(photos)
    .innerJoin(albums, eq(photos.albumId, albums.id))
    .innerJoin(categories, eq(albums.categoryId, categories.id))
    .where(and(eq(albums.status, 'published'), eq(categories.status, 'published')))
    .orderBy(asc(photos.id))
    .all()
    .map((photo) => photo.thumbnailUrl ?? photo.originalUrl);
}

export function selectPreloaderImages(
  candidates: string[],
  count = 5,
  random: () => number = Math.random,
) {
  if (count <= 0) return [];

  const shuffled = [...new Set(candidates.filter(Boolean))];
  if (!shuffled.length) return Array<string>(count).fill(FALLBACK_IMAGE);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.floor(random() * (index + 1)));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }

  return Array.from({ length: count }, (_, index) => shuffled[index % shuffled.length]!);
}

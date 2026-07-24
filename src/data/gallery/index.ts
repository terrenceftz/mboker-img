/**
 * 作品集数据导出入口
 */

// 类型定义导出
export * from './types';

// 作品集数据导出
export { sunsetGallery } from './sunset';
export { cityGallery } from './city';
export { natureGallery } from './nature';
export { momentGallery } from './moment';
export { altayGallery } from './altay';

// 导入所有作品集
import { sunsetGallery } from './sunset';
import { cityGallery } from './city';
import { natureGallery } from './nature';
import { momentGallery } from './moment';
import { altayGallery } from './altay';
import type { GalleryConfig } from './types';

/**
 * 所有作品集列表
 */
export const allGalleries: GalleryConfig[] = [
  sunsetGallery,
  cityGallery,
  natureGallery,
  momentGallery,
  altayGallery,
];

// sunset, city, nature and moment currently have same-name static routes in
// src/pages/collection. Their configurations remain here for a future
// data-driven migration; the dynamic [slug] route currently serves Altay.

/**
 * 根据 slug 获取作品集
 */
export function getGalleryBySlug(slug: string): GalleryConfig | undefined {
  return allGalleries.find((g) => g.slug === slug);
}

/**
 * 获取所有作品集 slug 列表
 */
export function getAllGallerySlugs(): string[] {
  return allGalleries.map((g) => g.slug);
}

/**
 * 获取精选作品集
 */
export function getFeaturedGalleries(): GalleryConfig[] {
  return allGalleries.filter((g) => g.featured);
}

/**
 * 获取相邻作品集
 */
export function getAdjacentGalleries(
  currentSlug: string
): { prev: GalleryConfig | null; next: GalleryConfig | null } {
  const currentIndex = allGalleries.findIndex((g) => g.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allGalleries[currentIndex - 1] : null,
    next:
      currentIndex < allGalleries.length - 1
        ? allGalleries[currentIndex + 1]
        : null,
  };
}

import type { PhotoVariants, ResponsivePhotoVariant } from '../db/schema';

export type LayoutPreset = 'auto' | 'wide' | 'standard' | 'narrow';
export type ImageAlign = 'start' | 'center' | 'end';

export type StorageScope =
  | { kind: 'album'; id: number }
  | { kind: 'site'; key: 'category-cover' | 'post-cover' | 'about-portrait' };

export type ProcessedPhotoVariants = PhotoVariants & {
  webp: ResponsivePhotoVariant[];
  avif: ResponsivePhotoVariant[];
};

export type ProcessedUpload = {
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  variants: ProcessedPhotoVariants;
  automaticLayout: Exclude<LayoutPreset, 'auto'>;
};

export function chooseAutomaticLayout(width: number, height: number): Exclude<LayoutPreset, 'auto'> {
  const ratio = width / height;
  if (ratio >= 1.6) return 'wide';
  if (ratio <= 0.8) return 'narrow';
  return 'standard';
}

import { photos, type SpecialLayoutBlock, type SpecialLayoutDocument } from '../db/schema';

type Photo = typeof photos.$inferSelect;

export type ResolvedSpecialLayoutBlock =
  | (Extract<SpecialLayoutBlock, { type: 'image' }> & { photo: Photo | null })
  | Extract<SpecialLayoutBlock, { type: 'markdown' }>
  | (Extract<SpecialLayoutBlock, { type: 'split' }> & { photo: Photo | null })
  | (Extract<SpecialLayoutBlock, { type: 'twoImages' }> & {
      leftPhoto: Photo | null;
      rightPhoto: Photo | null;
    });

export function referencedPhotoIds(layout: SpecialLayoutDocument) {
  const ids = new Set<number>();
  for (const block of layout.blocks) {
    if (block.type === 'image' || block.type === 'split') ids.add(block.photoId);
    if (block.type === 'twoImages') {
      ids.add(block.leftPhotoId);
      ids.add(block.rightPhotoId);
    }
  }
  return [...ids];
}

export function resolveSpecialLayout(
  layout: SpecialLayoutDocument,
  albumPhotos: Photo[],
): ResolvedSpecialLayoutBlock[] {
  const byId = new Map(albumPhotos.map((photo) => [photo.id, photo]));
  return layout.blocks.map((block) => {
    if (block.type === 'image' || block.type === 'split') {
      return { ...block, photo: byId.get(block.photoId) ?? null };
    }
    if (block.type === 'twoImages') {
      return {
        ...block,
        leftPhoto: byId.get(block.leftPhotoId) ?? null,
        rightPhoto: byId.get(block.rightPhotoId) ?? null,
      };
    }
    return block;
  });
}

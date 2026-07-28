import { describe, expect, it } from 'vitest';

const photo = (id: number, pairWithNext = false) => ({
  id,
  layoutJson: pairWithNext ? { pairWithNext: true as const } : {},
});

describe('ordinary gallery photo grouping', () => {
  it('groups a flagged photo with the next photo and leaves the remainder single', async () => {
    const module = await import('../../src/server/gallery/group-photos').catch(() => null);
    expect(module).not.toBeNull();
    if (!module) return;
    const [first, second, third] = [photo(1, true), photo(2, true), photo(3)];

    expect(module.groupGalleryPhotos([first, second, third])).toEqual([
      { type: 'pair', first, second },
      { type: 'single', photo: third },
    ]);
  });

  it('degrades an unmatched final pair flag to a single photo', async () => {
    const module = await import('../../src/server/gallery/group-photos').catch(() => null);
    expect(module).not.toBeNull();
    if (!module) return;
    const only = photo(1, true);

    expect(module.groupGalleryPhotos([only])).toEqual([{ type: 'single', photo: only }]);
  });
});

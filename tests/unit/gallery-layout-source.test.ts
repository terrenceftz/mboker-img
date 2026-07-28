import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('ordinary gallery layout rendering', () => {
  it('uses current CMS fields and visibly positions the sized image column', () => {
    const source = readFileSync('src/components/gallery/DynamicGalleryImage.astro', 'utf8');

    expect(source).toContain('const align = photo.align;');
    expect(source).toContain('const hasBackground = photo.hasBackground;');
    expect(source).toContain('const padding = photo.padding;');
    expect(source).toContain(".collection-item[data-align='start']");
    expect(source).toContain(".collection-item[data-align='center']");
    expect(source).toContain(".collection-item[data-align='end']");
    expect(source).toContain('margin-inline: auto');
  });

  it('groups ordinary photos and renders responsive paired rows', () => {
    const pairPath = 'src/components/gallery/PairedGalleryRow.astro';
    expect(existsSync(pairPath)).toBe(true);
    if (!existsSync(pairPath)) return;
    const page = readFileSync('src/pages/collection/[category]/[album].astro', 'utf8');
    const pair = readFileSync(pairPath, 'utf8');

    expect(page).toContain('groupGalleryPhotos');
    expect(page).toContain('PairedGalleryRow');
    expect(pair).toContain("data-ratio='2:3'");
    expect(pair).toContain("data-ratio='3:2'");
    expect(pair).toContain("data-vertical-align='center'");
    expect(pair).toContain('grid-template-columns: 1fr !important');
  });
});

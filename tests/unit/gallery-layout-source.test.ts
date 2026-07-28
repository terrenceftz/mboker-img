import { readFileSync } from 'node:fs';

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
});

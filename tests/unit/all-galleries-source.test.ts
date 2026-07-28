import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('all galleries page source', () => {
  it('renders every published group and album from the gallery index', () => {
    const page = readFileSync('src/pages/collection/index.astro', 'utf8');

    expect(page).toContain('getPublishedGalleryIndex');
    expect(page).toContain('galleryIndex.map');
    expect(page).toContain('group.category.title');
    expect(page).toContain('/collection/${group.category.slug}/${album.slug}');
  });

  it('shows dates and special status without a search workflow', () => {
    const page = readFileSync('src/pages/collection/index.astro', 'utf8');

    expect(page).toContain('album.shotDate');
    expect(page).toContain('特辑');
    expect(page).not.toMatch(/type=["']search["']/);
  });

  it('uses an uncropped staggered grid that becomes one column on mobile', () => {
    const page = readFileSync('src/pages/collection/index.astro', 'utf8');

    expect(page).toMatch(/\.gallery-index-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2/s);
    expect(page).toContain('object-fit: contain');
    expect(page).toContain('height: auto');
    expect(page).toMatch(/@media\s*\(max-width:\s*767px\)[\s\S]*grid-template-columns:\s*1fr/);
  });
});

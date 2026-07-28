import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('homepage gallery preloader source', () => {
  it('selects published gallery images in the homepage and passes them through the layout', () => {
    const homepage = readFileSync(resolve('src/pages/index.astro'), 'utf8');
    const layout = readFileSync(resolve('src/layouts/Layout.astro'), 'utf8');

    expect(homepage).toContain('listPublishedPreloaderImageUrls');
    expect(homepage).toContain('selectPreloaderImages');
    expect(homepage).toContain('preloaderImages={preloaderImages}');
    expect(layout).toContain('preloaderImages?: string[]');
    expect(layout).toContain('images={preloaderImages}');
  });

  it('renders an eager decorative montage instead of a fixed portrait', () => {
    const preloader = readFileSync(resolve('src/functions/Preloader.astro'), 'utf8');

    expect(preloader).toContain('images?: string[]');
    expect(preloader).toContain('class="preloader-montage"');
    expect(preloader).toContain('images.map');
    expect(preloader).toContain('loading="eager"');
    expect(preloader).not.toContain('src="/hero-preloader.jpg"');
    expect(preloader).not.toContain('/hero.gif');
  });
});

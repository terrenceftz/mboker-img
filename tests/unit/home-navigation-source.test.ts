import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('visitor category navigation', () => {
  it('renders the menu from configured published CMS albums', () => {
    const menu = readFileSync('src/components/Menu.astro', 'utf8');

    expect(menu).toContain('resolveNavigationAlbums');
    expect(menu).toContain('menuItems.map');
    expect(menu).not.toContain('href="/posts/altay"');
  });

  it('fills featured cards with full-size media before positioning their text', () => {
    const homepage = readFileSync('src/pages/index.astro', 'utf8');
    const cards = readFileSync('src/components/IndexCard.astro', 'utf8');

    expect(homepage).toContain('imageUrl: photo.originalUrl');
    expect(cards).toContain('class="index-card__media"');
    expect(cards).toContain('.index-card__media .gsap-picture');
    expect(cards).not.toContain('categoryById');
    expect(cards).not.toMatch(/2023-\d{2}/);
  });

  it('renders configurable homepage images and the Mboker handwriting animation', () => {
    const homepage = readFileSync('src/pages/index.astro', 'utf8');

    expect(homepage).toContain("settings?.homeHeroUrl || '/hero01.jpg'");
    expect(homepage).toContain("settings?.homeSideUrl || '/hero02.jpg'");
    expect(existsSync('public/mboker.png')).toBe(true);
    expect(homepage).toContain('src="/mboker.png"');
    expect(homepage).toContain('class="mboker-signature"');
    expect(homepage).not.toContain('<text class="mboker-signature"');
    expect(homepage).not.toContain('M4 74.3544C38.0681');
  });

  it('preserves the natural ratio and transparency of the homepage side image', () => {
    const homepage = readFileSync('src/pages/index.astro', 'utf8');

    expect(homepage).toContain('.side-picture__img');
    expect(homepage).toContain('object-fit: contain');
    expect(homepage).toContain('width: clamp(200px, 26vw, 460px)');
    expect(homepage).toContain('width: min(76vw, 360px)');
    expect(homepage).not.toContain('height:15vw');
    expect(homepage).not.toContain('max-width: 80%');
    expect(homepage).not.toContain('side-img col-12');
    expect(homepage).not.toContain('side-picture col-5');
  });

  it('starts the Mboker drawing after the homepage title reveal', () => {
    const homepage = readFileSync('src/pages/index.astro', 'utf8');
    const intros = readFileSync('src/scripts/animation/page-intros.js', 'utf8');

    expect(homepage).toContain('.hero-line.motion-svg__heroline .mboker-signature');
    expect(homepage).toMatch(/\.mboker-signature\s*\{[^}]*animation:\s*none/s);
    expect(homepage).toMatch(/animation:\s*draw-mboker\s+10s[^;]*infinite/s);
    expect(intros).toContain('document.querySelector(".hero-splitting-title")');
    expect(intros).not.toContain('document.querySelector(".hero-heading")');
  });

  it('reveals the Mboker Img byline with the homepage intro', () => {
    const homepage = readFileSync('src/pages/index.astro', 'utf8');
    const intros = readFileSync('src/scripts/animation/page-intros.js', 'utf8');

    expect(homepage).toContain('class="user hero-byline"');
    expect(intros).toContain('document.querySelector(".hero-byline")');
    expect(intros).toContain('byline.querySelectorAll(".char")');
  });
});

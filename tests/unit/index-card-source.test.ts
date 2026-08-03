import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('homepage gallery card sizing', () => {
  const source = readFileSync('src/components/IndexCard.astro', 'utf8');

  it('uses independent desktop caps for the nine asymmetric card positions', () => {
    const expectedCaps = [900, 440, 620, 860, 600, 520, 840, 600, 900];

    expectedCaps.forEach((width, index) => {
      const position = index + 1;
      expect(source).toContain(
        `.index-card:nth-child(9n + ${position}) .index-card__inner { max-width: ${width}px; }`,
      );
    });
  });

  it('preserves complete images without fixed-height cropping', () => {
    expect(source).toMatch(/\.index-card__img\s*\{[^}]*height:\s*auto/s);
    expect(source).not.toMatch(/\.index-card__img\s*\{[^}]*(?:object-fit:\s*cover|aspect-ratio:)/s);
  });

  it('bounds portrait covers by height while preserving intrinsic proportions', () => {
    const expectedHeightCaps = [760, 620, 700, 760, 700, 720, 760, 800, 900];

    expect(source).toContain('.index-card__media .gsap-picture {');
    expect(source).toMatch(/@media \(min-width: 992px\)[\s\S]*\.index-card__inner,[\s\S]*width:\s*auto;[\s\S]*max-width:\s*100%;/);
    expect(source).toMatch(/@media \(min-width: 992px\)[\s\S]*\.index-card__img\s*\{[^}]*width:\s*auto;/);
    expectedHeightCaps.forEach((height, index) => {
      const position = index + 1;
      expect(source).toContain(
        `.index-card:nth-child(9n + ${position}) .index-card__img { max-height: min(${height}px, 78vh); }`,
      );
    });
  });
});

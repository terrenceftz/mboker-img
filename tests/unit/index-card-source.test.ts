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
});

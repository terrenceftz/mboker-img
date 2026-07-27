import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('photo admin workflow source', () => {
  it('updates saved photo cards in place instead of reloading the page', () => {
    const source = readFileSync('src/components/admin/PhotoEditor.astro', 'utf8');

    expect(source).toContain("new CustomEvent('photo:updated'");
    expect(source).not.toContain('window.location.reload()');
  });

  it('offers batch layout controls and reference-aware deletion', () => {
    const source = readFileSync('src/components/admin/PhotoGrid.astro', 'utf8');

    expect(source).toContain('data-apply-layout');
    expect(source).toContain('specialReferenceCount');
    expect(source).toContain("addEventListener('photo:updated'");
  });
});

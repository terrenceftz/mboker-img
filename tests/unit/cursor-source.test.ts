import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('visitor cursor source', () => {
  it('only hides the system cursor after native cursor initialization succeeds', () => {
    const source = readFileSync('src/functions/Cursor.astro', 'utf8');

    expect(source).toContain('pointermove');
    expect(source).toContain('requestAnimationFrame');
    expect(source).toContain('custom-cursor-ready');
    expect(source).toContain('astro:before-swap');
    expect(source).not.toMatch(/import\s+paper/);
    expect(source).not.toContain('<canvas');
    expect(source).not.toMatch(/html\s*,\s*body\s*\{\s*cursor:\s*none/);
  });
});

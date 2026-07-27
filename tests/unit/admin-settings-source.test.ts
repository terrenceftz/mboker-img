import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('admin homepage image settings', () => {
  it('spans both parent form columns before splitting into two image cards', () => {
    const settingsPage = readFileSync('src/pages/admin/settings.astro', 'utf8');

    expect(settingsPage).toMatch(/\.image-setting-grid\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  });

  it('accepts uploaded site paths without browser URL type mismatch', () => {
    const settingsPage = readFileSync('src/pages/admin/settings.astro', 'utf8');

    expect(settingsPage).toContain('name="homeHeroUrl" type="text" inputmode="url"');
    expect(settingsPage).toContain('name="homeSideUrl" type="text" inputmode="url"');
  });
});

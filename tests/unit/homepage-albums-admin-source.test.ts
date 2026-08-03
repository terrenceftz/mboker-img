import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('homepage album selection admin page', () => {
  it('lists created albums as grouped checkboxes without a search control', () => {
    const page = readFileSync('src/pages/admin/homepage.astro', 'utf8');

    expect(page).toContain('listCategoriesAdmin');
    expect(page).toContain('listAlbumsAdmin');
    expect(page).toContain('type="checkbox"');
    expect(page).toContain('data-homepage-choice');
    expect(page).not.toMatch(/type=["']search["']/);
  });

  it('saves selected album ids through the dedicated API', () => {
    const page = readFileSync('src/pages/admin/homepage.astro', 'utf8');

    expect(page).toContain("fetch('/api/admin/homepage-albums'");
    expect(page).toContain("method: 'PUT'");
    expect(page).toContain('JSON.stringify({ albumIds: selectedIds })');
  });

  it('adds homepage galleries to the admin sidebar', () => {
    const sidebar = readFileSync('src/components/admin/AdminSidebar.astro', 'utf8');

    expect(sidebar).toContain('/admin/homepage');
    expect(sidebar).toContain('主页图集');
  });
});

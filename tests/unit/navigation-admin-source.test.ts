import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('navigation admin page source', () => {
  it('provides grouped album choices and an ordered selected list', () => {
    const page = readFileSync('src/pages/admin/navigation.astro', 'utf8');

    expect(page).toContain('listCategoriesAdmin');
    expect(page).toContain('listAlbumsAdmin');
    expect(page).toContain('type="checkbox"');
    expect(page).toContain('data-navigation-selected');
    expect(page).toContain('drag-handle');
    expect(page).toContain("Sortable.create");
  });

  it('saves ordered album ids and intentionally has no search control', () => {
    const page = readFileSync('src/pages/admin/navigation.astro', 'utf8');

    expect(page).toContain("fetch('/api/admin/navigation'");
    expect(page).toContain("method: 'PUT'");
    expect(page).toContain('JSON.stringify({ albumIds: selectedIds })');
    expect(page).not.toMatch(/type=["']search["']/);
  });

  it('hydrates the saved cross-category order from the selected list', () => {
    const page = readFileSync('src/pages/admin/navigation.astro', 'utf8');

    expect(page).toContain("let selectedIds = Array.from(selectedList?.querySelectorAll<HTMLElement>('[data-selected-item]') ?? [])");
  });

  it('adds navigation settings to the admin sidebar', () => {
    const sidebar = readFileSync('src/components/admin/AdminSidebar.astro', 'utf8');

    expect(sidebar).toContain('/admin/navigation');
    expect(sidebar).toContain('导航设置');
  });
});

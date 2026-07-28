import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('configurable theme directory source', () => {
  it('resolves album navigation from site settings', () => {
    const menu = readFileSync('src/components/Menu.astro', 'utf8');

    expect(menu).toContain('resolveNavigationAlbums');
    expect(menu).toContain('getSettings');
    expect(menu).not.toContain('listCategoriesPublished');
    expect(menu).not.toContain('listAlbumsPublished');
  });

  it('always appends the all-galleries destination', () => {
    const menu = readFileSync('src/components/Menu.astro', 'utf8');

    expect(menu).toContain("title: '更多'");
    expect(menu).toContain("href: '/collection'");
    expect(menu).toContain("coverUrl: '/menu/other.jpg'");
  });

  it('keeps long menus reachable without resizing the viewport', () => {
    const menu = readFileSync('src/components/Menu.astro', 'utf8');

    expect(menu).toMatch(/\.menu-nav\s*\{[^}]*max-height:\s*calc\(/s);
    expect(menu).toMatch(/\.menu-nav\s*\{[^}]*overflow-y:\s*auto/s);
    expect(menu).toContain('overscroll-behavior: contain');
  });

  it('keeps the hover arrow inside the scrollable menu region', () => {
    const menu = readFileSync('src/components/Menu.astro', 'utf8');
    const globalStyles = readFileSync('src/styles/global.scss', 'utf8');

    expect(menu).toMatch(/&__link\s*\{[^}]*padding-left:\s*1\.2em/s);
    expect(menu).toMatch(/\.menu-item\s*\{[\s\S]*?svg\s*\{[^}]*left:\s*0/s);
    expect(menu).not.toContain('left: -1.2em');
    expect(globalStyles).not.toContain('left: -1.2em');
  });
});

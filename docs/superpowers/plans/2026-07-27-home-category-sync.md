# Home Category Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide draft categories from the visitor menu and keep homepage featured text consistently adjacent to its visible image.

**Architecture:** Render menu items from the existing published category and album repositories inside the server-rendered Astro component. Keep the original alternating grid, but make each dynamic image fill its grid card and use the original media URL for large homepage display.

**Tech Stack:** Astro 7, TypeScript, SCSS, Drizzle ORM, Vitest, Playwright CLI

---

### Task 1: Dynamic Visitor Menu

**Files:**
- Modify: `src/components/Menu.astro`
- Create: `tests/unit/home-navigation-source.test.ts`

- [ ] **Step 1: Write the failing source test**

Assert that `Menu.astro` imports `listCategoriesPublished`, maps the returned categories, and no longer contains the hard-coded `/posts/altay` menu link.

```ts
const menu = readFileSync('src/components/Menu.astro', 'utf8');
expect(menu).toContain('listCategoriesPublished');
expect(menu).toContain('menuItems.map');
expect(menu).not.toContain('href="/posts/altay"');
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `node node_modules/vitest/vitest.mjs run tests/unit/home-navigation-source.test.ts`

Expected: FAIL because `Menu.astro` still contains five static menu items.

- [ ] **Step 3: Render published categories**

In `Menu.astro`, load published categories and their first published album:

```ts
const menuItems = listCategoriesPublished(db).map((category) => {
  const album = listAlbumsPublished(db, category.id)[0];
  const photos = album ? listPhotos(db, album.id) : [];
  const cover = photos.find((photo) => photo.id === album?.coverPhotoId) ?? photos[0];
  return {
    title: category.title,
    href: album ? `/collection/${category.slug}/${album.slug}` : `/collection/${category.slug}`,
    coverUrl: category.coverUrl ?? cover?.thumbnailUrl ?? cover?.originalUrl ?? '/menu/other.jpg',
    special: Boolean(album?.isSpecial),
  };
});
```

Map `menuItems` into matching cover images and menu links. Add `js-menu-cover--active` only to the first cover; the existing animation script pairs items and covers by array order.

- [ ] **Step 4: Run the focused test and repository visibility test**

Run: `node node_modules/vitest/vitest.mjs run tests/unit/home-navigation-source.test.ts tests/unit/repositories-import.test.ts`

Expected: PASS.

### Task 2: Stable Featured Image/Text Geometry

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/IndexCard.astro`
- Modify: `tests/unit/home-navigation-source.test.ts`

- [ ] **Step 1: Add a failing layout source test**

Assert that featured data uses `photo.originalUrl` and that the dynamic image anchor plus `.gsap-picture` are block-level, full-width elements.

```ts
const homepage = readFileSync('src/pages/index.astro', 'utf8');
const cards = readFileSync('src/components/IndexCard.astro', 'utf8');
expect(homepage).toContain('imageUrl: photo.originalUrl');
expect(cards).toContain('class="index-card__media"');
expect(cards).toContain('.index-card__media .gsap-picture');
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `node node_modules/vitest/vitest.mjs run tests/unit/home-navigation-source.test.ts`

Expected: FAIL because the homepage currently prefers the 480px thumbnail and leaves the inline wrappers unstabilized.

- [ ] **Step 3: Fill the card and preserve the 20px gap**

Change the featured item to `imageUrl: photo.originalUrl`. Add a class to the dynamic image link and apply:

```scss
.index-card__media,
.index-card__media .gsap-picture {
  display: block;
  width: 100%;
}
```

Keep the existing `left: -20px` and `right: -20px` placements so the text remains exactly 20px from the now full-width image edge.

- [ ] **Step 4: Run focused tests and browser geometry checks**

Run: `node node_modules/vitest/vitest.mjs run tests/unit/home-navigation-source.test.ts`

Then verify at 2048px that each loaded `.index-card__img` fills its `.index-card` and the adjacent `.index-card__info` edge is 20px away. Verify at 390px that image and text remain stacked without horizontal overflow.

- [ ] **Step 5: Run the complete verification suite and commit**

Run:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/@astrojs/check/dist/cli.js
$env:ASTRO_TELEMETRY_DISABLED='1'; node node_modules/astro/astro.js build
```

Expected: all tests pass, Astro reports zero errors, and the production build exits 0.

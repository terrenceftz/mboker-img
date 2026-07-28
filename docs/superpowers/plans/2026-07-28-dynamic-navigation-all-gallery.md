# Dynamic Navigation and All Galleries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators choose and order album links in the theme directory and provide a styled `/collection` page containing every published category and album.

**Architecture:** Store an optional versioned list of album IDs in site settings. Resolve current album, category, cover, and publication state at read time; keep the “更多” entry and all-gallery index independent from configured navigation.

**Tech Stack:** Astro 7, TypeScript, Drizzle ORM with SQLite, Zod, SortableJS, Vitest, Docker, Playwright CLI.

---

### Task 1: Persist and resolve navigation configuration

**Files:**
- Modify: `src/server/db/schema.ts`
- Create: `src/server/repositories/navigation.ts`
- Create: `src/server/validation/navigation.ts`
- Create: `tests/integration/navigation-settings.test.ts`
- Create: `drizzle/0005_dynamic_navigation.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0005_snapshot.json`

- [ ] **Step 1: Write failing repository and validation tests**

Test these cases with `createTestDatabase()`:

```ts
expect(navigationInput.parse({ albumIds: [second.id, first.id] })).toEqual({ albumIds: [second.id, first.id] });
expect(() => navigationInput.parse({ albumIds: [first.id, first.id] })).toThrow();
expect(resolveNavigationAlbums(db, null).map((item) => item.id)).toEqual([fallbackAlbum.id]);
expect(resolveNavigationAlbums(db, { version: 1, albumIds: [second.id, draft.id, first.id] }).map((item) => item.id))
  .toEqual([second.id, first.id]);
```

Also verify an album in a draft category and a deleted ID are skipped without reordering the remaining IDs.

- [ ] **Step 2: Run the new tests and verify RED**

Run `pnpm vitest run tests/integration/navigation-settings.test.ts`.

Expected: FAIL because navigation types, schema, validation, and repository do not exist.

- [ ] **Step 3: Add the nullable schema field and migration**

Define:

```ts
export type NavigationConfig = { version: 1; albumIds: number[] };
```

Add to `siteSettings`:

```ts
navigationJson: text('navigation_json', { mode: 'json' }).$type<NavigationConfig>(),
```

Generate migration metadata with `pnpm db:generate --name dynamic_navigation`. Confirm `drizzle/0005_dynamic_navigation.sql` only adds the nullable `navigation_json` column and never recreates or clears existing tables.

- [ ] **Step 4: Implement validation and repository resolution**

Use strict validation:

```ts
export const navigationInput = z.object({
  albumIds: z.array(z.number().int().positive())
    .refine((ids) => new Set(ids).size === ids.length, '图集不能重复'),
}).strict();
```

Implement `resolveNavigationAlbums(db, config)`:

- `config === null`: preserve the current behavior by taking the first published album from each published category.
- Configured array: fetch published albums in published categories, map by ID, then return IDs in configured order.
- Attach cover photo using `coverPhotoId`, then first photo, then `/menu/other.jpg`.
- Export `filterExistingAlbumIds(db, ids)` to remove deleted IDs while preserving valid draft and published album IDs in their requested order.

- [ ] **Step 5: Run tests and verify GREEN**

Run `pnpm vitest run tests/integration/navigation-settings.test.ts`.

Expected: PASS.

- [ ] **Step 6: Commit**

Commit as `feat: persist gallery navigation settings`.

### Task 2: Build the backend navigation workflow

**Files:**
- Create: `src/pages/api/admin/navigation.ts`
- Create: `src/pages/admin/navigation.astro`
- Modify: `src/components/admin/AdminSidebar.astro`
- Create: `tests/integration/navigation-admin.test.ts`
- Create: `tests/unit/navigation-admin-source.test.ts`

- [ ] **Step 1: Write failing API tests**

Mock admin session using the existing API test pattern. Assert unauthenticated requests return `401`; PUT with `{ albumIds: [second.id, first.id] }` returns and persists:

```ts
{ version: 1, albumIds: [second.id, first.id] }
```

Assert duplicates return `422`, and saving `{ albumIds: [] }` is preserved as an explicit empty configuration rather than `null`.

- [ ] **Step 2: Run API tests and verify RED**

Run `pnpm vitest run tests/integration/navigation-admin.test.ts`.

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement GET and PUT API routes**

`GET` returns the current nullable config. `PUT` requires admin, parses `navigationInput`, filters out deleted IDs while retaining valid draft selections, and writes:

```ts
const albumIds = filterExistingAlbumIds(db, parsed.data.albumIds);
upsertSettings(db, { navigationJson: { version: 1, albumIds } });
```

Return the saved configuration through `apiData`.

- [ ] **Step 4: Write failing admin-page source assertions**

Assert the page has grouped albums, checkbox inputs, selected-item drag handles, a save request to `/api/admin/navigation`, no search input, and that `AdminSidebar.astro` contains `/admin/navigation` labeled `导航设置`.

- [ ] **Step 5: Run source tests and verify RED**

Run `pnpm vitest run tests/unit/navigation-admin-source.test.ts`.

Expected: FAIL because the page and sidebar item are absent.

- [ ] **Step 6: Implement the admin page**

Render all admin albums grouped by category. The selected panel uses compact rows with cover thumbnail, album title, category, publication status, drag handle, and remove button. Use SortableJS only on the selected panel.

Checkbox changes add or remove selected rows. Submit ordered IDs:

```ts
await fetch('/api/admin/navigation', {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ albumIds: selectedIds }),
});
```

Do not add a search field. Use existing admin variables, buttons, 6-8px radii, and responsive single-column layout.

- [ ] **Step 7: Verify GREEN and commit**

Run:

```powershell
pnpm vitest run tests/integration/navigation-admin.test.ts tests/unit/navigation-admin-source.test.ts
```

Expected: both files pass. Commit as `feat: add navigation management page`.

### Task 3: Update the theme directory

**Files:**
- Modify: `src/components/Menu.astro`
- Modify: `src/server/repositories/navigation.ts`
- Create: `tests/unit/menu-navigation-source.test.ts`

- [ ] **Step 1: Write failing menu-source tests**

Assert `Menu.astro` calls `resolveNavigationAlbums`, no longer maps published categories directly, appends an item with title `更多` and href `/collection`, and applies a scrollable menu container.

- [ ] **Step 2: Run the source test and verify RED**

Run `pnpm vitest run tests/unit/menu-navigation-source.test.ts`.

Expected: FAIL because the menu still renders one category entry per category and has no fixed “更多”.

- [ ] **Step 3: Render resolved album links plus “更多”**

Build menu items from the repository result:

```ts
const menuItems = [
  ...resolveNavigationAlbums(db, getSettings(db)?.navigationJson ?? null),
  { title: '更多', href: '/collection', coverUrl: '/menu/other.jpg', special: false },
];
```

Preserve existing cover switching and animations. Add `overflow-y:auto` and stable minimum sizing to `.menu-nav`/`.menu-main` so every entry remains reachable.

- [ ] **Step 4: Verify and commit**

Run `pnpm vitest run tests/unit/menu-navigation-source.test.ts tests/integration/navigation-settings.test.ts`.

Expected: both pass. Commit as `feat: make theme directory configurable`.

### Task 4: Build the all-galleries page

**Files:**
- Modify: `src/server/repositories/visitor-gallery.ts`
- Create: `src/pages/collection/index.astro`
- Create: `tests/integration/all-galleries.test.ts`
- Create: `tests/unit/all-galleries-source.test.ts`

- [ ] **Step 1: Write failing gallery-index repository tests**

Seed published and draft categories/albums with photos. Assert:

```ts
expect(getPublishedGalleryIndex(db)).toEqual([
  expect.objectContaining({
    category: expect.objectContaining({ id: publishedCategory.id }),
    albums: [expect.objectContaining({ id: first.id }), expect.objectContaining({ id: second.id })],
  }),
]);
```

Verify category and album sort order, cover fallback, draft filtering, and omission of published categories with no published albums.

- [ ] **Step 2: Run repository tests and verify RED**

Run `pnpm vitest run tests/integration/all-galleries.test.ts`.

Expected: FAIL because `getPublishedGalleryIndex` does not exist.

- [ ] **Step 3: Implement the grouped index query**

Reuse `listCategoriesPublished`, `listAlbumsPublished`, and `listPhotos` to return:

```ts
Array<{
  category: PublishedCategory;
  albums: Array<PublishedAlbum & { cover: Photo | null }>;
}>
```

Filter out categories whose album array is empty.

- [ ] **Step 4: Write failing page-source tests**

Assert the page calls `getPublishedGalleryIndex`, renders category headings and album links, uses `shotDate`, displays `特辑`, and contains responsive staggered-grid styles without a search input.

- [ ] **Step 5: Run page-source tests and verify RED**

Run `pnpm vitest run tests/unit/all-galleries-source.test.ts`.

Expected: FAIL because `/collection` has no index page.

- [ ] **Step 6: Implement `/collection` in the current front-end style**

Use `BaseLayout`, existing header/footer components, black/white typography, large whitespace, and uncropped images. Each category is an unframed full-width section with a divider, bilingual title, album count, and a staggered two-column album grid. Use `aspect-ratio` only for stable empty placeholders; real images use `height:auto` and `object-fit:contain`.

At `max-width: 767px`, switch to one column and reduce spacing. Album links point to `/collection/{category.slug}/{album.slug}`. Display the year derived from `shotDate` when available and show `(特辑)` for special albums.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
pnpm vitest run tests/integration/all-galleries.test.ts tests/unit/all-galleries-source.test.ts
```

Expected: both files pass. Commit as `feat: add all galleries index`.

### Task 5: Verify navigation and deployment

**Files:**
- No production changes expected

- [ ] **Step 1: Run complete automated checks**

Run `pnpm test`, `pnpm check`, and `pnpm build` with Node `>=22.12`.

Expected: every command exits `0` with no Astro errors.

- [ ] **Step 2: Rebuild the existing Docker service**

Run `docker compose up -d --build`. Preserve the existing mounted directories on D:. Never run volume deletion commands.

- [ ] **Step 3: Verify the admin workflow with Playwright CLI**

Open `/admin/navigation`, select two albums from different categories, reorder them, save, reload, and confirm the same selection and order remain.

- [ ] **Step 4: Verify public desktop and mobile behavior**

Open the theme directory and confirm the two selected album titles appear in saved order followed by “更多”. Confirm “更多” opens `/collection`, every published category/album is present, draft content is absent, images are uncropped, and the page becomes one column on mobile.

- [ ] **Step 5: Commit scoped verification fixes if required**

For each defect found, add a failing regression test before changing production code, then rerun the full checks. Commit as `fix: polish navigation and gallery index`.

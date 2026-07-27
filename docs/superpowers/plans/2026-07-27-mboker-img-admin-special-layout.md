# Mboker Img Admin and Special Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the product to Mboker Img, modernize the CMS workflow, add a controlled WordPress-style special-layout editor, restore the Altay feature page, and fix the disappearing visitor cursor.

**Architecture:** Extend albums with a versioned special-layout JSON document validated by Zod. Keep photo ownership and media processing in the existing photo repository, render special albums through a dedicated Astro component, and enhance the current server-rendered admin with focused client-side editors and authenticated APIs.

**Tech Stack:** Astro 7 SSR, TypeScript, Drizzle ORM, SQLite, Zod, Marked, sanitize-html, SortableJS, Lucide Astro, Vitest, Playwright, Docker Compose

---

## File Map

- Modify `src/server/db/schema.ts`: persist special album state and define stored block types.
- Create `drizzle/0003_mboker_special_layout.sql`: add album columns without replacing existing data.
- Modify `drizzle/meta/_journal.json`: register the new migration.
- Create `src/server/validation/special-layout.ts`: validate versioned discriminated block data.
- Create `src/server/special-layout/resolve.ts`: resolve photo references and deterministic missing-image fallbacks.
- Modify `src/server/repositories/albums.ts`: transactionally save a special layout.
- Modify `src/server/repositories/visitor-gallery.ts`: return resolved blocks for special albums.
- Modify `scripts/import-legacy-content.ts`: seed Mboker Img defaults and create the initial Altay layout.
- Create `scripts/backfill-altay-special.ts`: idempotently update an already-imported Altay album.
- Create `src/components/gallery/SpecialGallery.astro`: render image, Markdown, split, and two-image blocks.
- Modify `src/pages/collection/[category]/[album].astro`: choose ordinary or special rendering.
- Modify `src/components/gallery/DynamicGalleryImage.astro`: support block context without duplicating media markup.
- Create `src/components/admin/AlbumTabs.astro`: navigate album information, photos, and special layout.
- Create `src/components/admin/SpecialLayoutEditor.astro`: edit, preview, reorder, and save special blocks.
- Create `src/pages/admin/albums/[id]/special.astro`: load album photos into the special editor.
- Create `src/pages/api/admin/albums/[id]/special.ts`: authenticated special-layout read/write endpoint.
- Modify `src/components/admin/AlbumForm.astro`: expose the special toggle and keep tabs consistent.
- Modify `src/components/admin/PhotoEditor.astro`: live preview and local UI update after saving.
- Modify `src/components/admin/PhotoGrid.astro`: reference warnings, selection events, and batch layout actions.
- Modify `src/pages/api/admin/photos/[id].ts`: report special-block reference counts on deletion.
- Create `src/pages/api/admin/photos/batch-layout.ts`: apply one validated layout to selected photos in one album.
- Modify `src/server/repositories/posts.ts`: exclude future publications and support status filtering.
- Create `src/pages/admin/posts/[id]/preview.astro`: authenticated real visitor preview.
- Modify `src/components/admin/PostForm.astro`: fixed editorial toolbar and explicit actions.
- Modify `src/pages/admin/posts/index.astro`: status tabs without search.
- Modify `src/styles/admin.scss`: quiet studio palette, rounded controls, responsive editor layout.
- Modify `src/layouts/AdminLayout.astro` and `src/components/admin/AdminSidebar.astro`: Mboker Img branding and admin shell polish.
- Modify visitor/config/import/deployment files containing visible Tink branding.
- Modify `src/functions/Cursor.astro`: replace Paper.js with a native fail-safe cursor.
- Modify `package.json` and `pnpm-lock.yaml`: rename package and remove Paper.js.
- Add focused tests under `tests/unit` and `tests/integration`.

### Task 1: Add the Special Layout Schema and Validation

**Files:**
- Modify: `src/server/db/schema.ts`
- Create: `src/server/validation/special-layout.ts`
- Create: `drizzle/0003_mboker_special_layout.sql`
- Modify: `drizzle/meta/_journal.json`
- Test: `tests/unit/special-layout.test.ts`

- [ ] **Step 1: Write failing validation tests**

Test a valid image block, arbitrary 200,000-character Markdown, both split directions, all three ratios, two-image blocks, duplicate block IDs, invalid photo IDs, unsupported nested content, and more than 200 blocks.

```ts
const parsed = specialLayoutInput.parse({
  version: 1,
  blocks: [{ id: 'intro', type: 'split', direction: 'image-text', ratio: '2:3',
    verticalAlign: 'center', photoId: 7, markdown: '# Altay\n\nLong text' }],
});
expect(parsed.blocks[0]).toMatchObject({ type: 'split', photoId: 7 });
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `pnpm test tests/unit/special-layout.test.ts`

Expected: FAIL because `src/server/validation/special-layout.ts` does not exist.

- [ ] **Step 3: Define stored types and the Zod discriminated union**

Use stable string IDs and four stored block types:

```ts
export type SpecialLayoutDocument = {
  version: 1;
  blocks: Array<
    | { id: string; type: 'image'; photoId: number }
    | { id: string; type: 'markdown'; markdown: string }
    | { id: string; type: 'split'; direction: 'image-text' | 'text-image'; ratio: '1:1' | '2:3' | '3:2'; verticalAlign: 'start' | 'center' | 'end'; photoId: number; markdown: string }
    | { id: string; type: 'twoImages'; ratio: '1:1' | '2:3' | '3:2'; leftPhotoId: number; rightPhotoId: number }
  >;
};
```

Reject duplicate IDs with `superRefine`, cap Markdown at 200,000 characters per block, and cap a document at 200 blocks.

- [ ] **Step 4: Add non-destructive album columns**

Add `isSpecial` and typed `specialLayoutJson` fields to Drizzle. Create a migration containing:

```sql
ALTER TABLE `albums` ADD `is_special` integer DEFAULT false NOT NULL;
ALTER TABLE `albums` ADD `special_layout_json` text DEFAULT '{"version":1,"blocks":[]}' NOT NULL;
```

- [ ] **Step 5: Run validation and schema tests**

Run: `pnpm test tests/unit/special-layout.test.ts tests/unit/db-schema.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the schema slice**

```powershell
git add src/server/db/schema.ts src/server/validation/special-layout.ts drizzle tests/unit/special-layout.test.ts tests/unit/db-schema.test.ts
git commit -m "feat: add special album layout schema"
```

### Task 2: Save, Resolve, and Backfill Special Layouts

**Files:**
- Modify: `src/server/repositories/albums.ts`
- Create: `src/server/special-layout/resolve.ts`
- Modify: `src/server/repositories/visitor-gallery.ts`
- Modify: `scripts/import-legacy-content.ts`
- Create: `scripts/backfill-altay-special.ts`
- Test: `tests/integration/special-layout.test.ts`
- Modify: `tests/unit/repositories-import.test.ts`

- [ ] **Step 1: Write failing ownership and fallback tests**

Seed two albums and assert cross-album photo references are rejected. Assert resolver behavior for a missing image block, a split block with missing image, and a two-image block with one missing side. Assert an already customized Altay layout is not overwritten.

```ts
expect(() => saveSpecialLayout(db, album.id, {
  isSpecial: true,
  layout: { version: 1, blocks: [{ id: 'x', type: 'image', photoId: otherPhoto.id }] },
})).toThrowError('PHOTO_NOT_IN_ALBUM');
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm test tests/integration/special-layout.test.ts tests/unit/repositories-import.test.ts`

Expected: FAIL because the save and resolver functions are missing.

- [ ] **Step 3: Implement transactional save and visitor resolution**

Validate the JSON before repository access, collect unique photo IDs, verify every existing referenced photo belongs to the target album, and update `isSpecial`, `specialLayoutJson`, and `updatedAt` in one transaction. Preserve missing IDs that previously belonged to the album so the editor can repair them; reject IDs currently owned by another album.

Return resolved blocks with `photo`, `leftPhoto`, and `rightPhoto` values. Do not render unreferenced photos for special albums.

- [ ] **Step 4: Seed and backfill Altay idempotently**

Build the initial Markdown from the original `PostInfo.astro` fields. Use photo order and create a first `split` block followed by image blocks. Only apply when `slug === 'altay'` and `blocks.length === 0`.

```ts
const ALTAY_MARKDOWN = `**行程**  阿勒泰

**Name**  Altay

**地理位置**  阿勒泰地区西部

**记录时间**  2023.11

**印象**  冰天雪地、静谧、孤寂

**体验推荐**  禾木、喀纳斯、可可托海

**路线参考**  乌鲁木齐 → 布尔津 → 喀纳斯 → 禾木 → 克拉玛依 → 博乐 → 霍城 → 新源 → 巴音郭楞 → 独库公路`;
```

- [ ] **Step 5: Run the repository and importer tests**

Run: `pnpm test tests/integration/special-layout.test.ts tests/unit/repositories-import.test.ts tests/integration/visitor-gallery.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the data behavior**

```powershell
git add src/server/repositories src/server/special-layout scripts/import-legacy-content.ts scripts/backfill-altay-special.ts tests
git commit -m "feat: persist and backfill special layouts"
```

### Task 3: Render Special Albums on the Visitor Site

**Files:**
- Create: `src/components/gallery/SpecialGallery.astro`
- Modify: `src/components/gallery/DynamicGalleryImage.astro`
- Modify: `src/pages/collection/[category]/[album].astro`
- Test: `tests/integration/visitor-gallery.test.ts`

- [ ] **Step 1: Extend visitor tests for special albums**

Assert special albums return resolved blocks in stored order, ordinary albums still return their ordered photo list, and a future missing reference produces a safe fallback block.

- [ ] **Step 2: Run the visitor test and confirm it fails**

Run: `pnpm test tests/integration/visitor-gallery.test.ts`

Expected: FAIL because special layout data is not exposed.

- [ ] **Step 3: Build one renderer per block responsibility**

`SpecialGallery.astro` renders sanitized Markdown with `renderMarkdownSafe()` and reuses `DynamicGalleryImage` for media. Use CSS grid ratios:

```css
.special-block--split[data-ratio="1:1"] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.special-block--split[data-ratio="2:3"] { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
.special-block--split[data-ratio="3:2"] { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
@media (max-width: 767px) { .special-block--split, .special-block--two { grid-template-columns: 1fr !important; } }
```

Image-only missing blocks render nothing. Missing split images render Markdown full width. Two-image blocks with one remaining image render that image full width.

- [ ] **Step 4: Select the renderer in the album route**

Keep the existing ordinary gallery markup intact. When `album.isSpecial` is true, render `SpecialGallery` with the resolved blocks and use `Mboker Img` in fallback SEO.

- [ ] **Step 5: Build and run visitor tests**

Run: `pnpm test tests/integration/visitor-gallery.test.ts`

Run: `pnpm check`

Expected: both commands exit 0.

- [ ] **Step 6: Commit visitor rendering**

```powershell
git add src/components/gallery src/pages/collection tests/integration/visitor-gallery.test.ts
git commit -m "feat: render responsive special albums"
```

### Task 4: Build the Special Layout Admin Editor

**Files:**
- Create: `src/components/admin/AlbumTabs.astro`
- Create: `src/components/admin/SpecialLayoutEditor.astro`
- Create: `src/pages/admin/albums/[id]/special.astro`
- Create: `src/pages/api/admin/albums/[id]/special.ts`
- Modify: `src/pages/admin/albums/[id].astro`
- Modify: `src/pages/admin/albums/[id]/photos.astro`
- Modify: `src/components/admin/AlbumForm.astro`
- Modify: `src/styles/admin.scss`
- Test: `tests/integration/special-layout.test.ts`

- [ ] **Step 1: Add API behavior tests**

Assert unauthenticated requests return 401, malformed blocks return 422, cross-album photos return 409, valid layouts return 200, and the response contains the normalized document.

- [ ] **Step 2: Run the API test and verify failure**

Run: `pnpm test tests/integration/special-layout.test.ts`

Expected: FAIL because the API route does not exist.

- [ ] **Step 3: Add album tabs and the special page**

Use exact tabs “基本信息”, “图片管理”, and “特辑排版”. The special page loads the album and its photo list server-side and redirects invalid IDs back to `/admin/albums`.

- [ ] **Step 4: Implement the controlled block editor**

Render five add actions: full image, full Markdown, image-text, text-image, and two images. Serialize the four stored block types to one hidden state document. Use SortableJS for handles and provide move-up/move-down buttons. Image pickers only show the current album and dispatch to existing upload/external controls when empty.

Add desktop/mobile preview buttons, Markdown edit/preview, ratio and vertical alignment controls, delete confirmation, dirty tracking, `beforeunload`, and save states. POST the complete document to `/api/admin/albums/{id}/special`.

- [ ] **Step 5: Implement the authenticated API**

GET returns album state and photos. PATCH parses `specialLayoutInput`, calls `saveSpecialLayout`, and returns normalized data through the existing `apiData`, `validationError`, and `repositoryError` helpers.

- [ ] **Step 6: Verify UI compilation and API behavior**

Run: `pnpm test tests/integration/special-layout.test.ts`

Run: `pnpm check`

Expected: PASS and zero Astro errors.

- [ ] **Step 7: Commit the editor**

```powershell
git add src/components/admin src/pages/admin/albums src/pages/api/admin/albums src/styles/admin.scss tests/integration/special-layout.test.ts
git commit -m "feat: edit special album blocks"
```

### Task 5: Improve Photo Layout Editing and Reference Safety

**Files:**
- Modify: `src/components/admin/PhotoEditor.astro`
- Modify: `src/components/admin/PhotoGrid.astro`
- Modify: `src/pages/api/admin/photos/[id].ts`
- Create: `src/pages/api/admin/photos/batch-layout.ts`
- Modify: `src/server/repositories/photos.ts`
- Modify: `src/styles/admin.scss`
- Test: `tests/integration/photo-admin.test.ts`

- [ ] **Step 1: Add failing reference and batch-update tests**

Assert the photo detail response includes the number of special blocks referencing it. Assert a batch layout update modifies only photos in one album and rejects IDs from another album.

- [ ] **Step 2: Run the photo tests and confirm failure**

Run: `pnpm test tests/integration/photo-admin.test.ts`

Expected: FAIL on missing reference and batch behavior.

- [ ] **Step 3: Add repository helpers and API response metadata**

Scan special layout documents for `photoId`, `leftPhotoId`, and `rightPhotoId`. Return `specialReferenceCount` before deletion. Keep confirmed deletion behavior unchanged so missing-reference fallback remains testable.

- [ ] **Step 4: Make photo editing update in place**

After saving, replace the card's serialized photo data, badges, preview class, and current editor controls without `window.location.reload()`. Add a stable preview using the selected preset, background, padding, and alignment.

- [ ] **Step 5: Add batch layout application**

When multiple cards are selected, expose one “应用布局” action that sends the chosen preset, alignment, background, and padding to all selected IDs. Show reference counts in the delete confirmation.

- [ ] **Step 6: Run photo tests and Astro checks**

Run: `pnpm test tests/integration/photo-admin.test.ts`

Run: `pnpm check`

Expected: PASS.

- [ ] **Step 7: Commit photo workflow changes**

```powershell
git add src/components/admin/PhotoEditor.astro src/components/admin/PhotoGrid.astro src/pages/api/admin/photos src/server/repositories/photos.ts src/styles/admin.scss tests/integration/photo-admin.test.ts
git commit -m "feat: streamline photo layout editing"
```

### Task 6: Streamline Blog Preview and Publishing

**Files:**
- Modify: `src/server/repositories/posts.ts`
- Modify: `src/server/validation/post.ts`
- Modify: `src/components/admin/PostForm.astro`
- Modify: `src/components/admin/MarkdownEditor.astro`
- Modify: `src/pages/admin/posts/index.astro`
- Create: `src/pages/admin/posts/[id]/preview.astro`
- Modify: `src/pages/api/admin/posts/[id].ts`
- Test: `tests/integration/posts.test.ts`

- [ ] **Step 1: Write future-publication and status tests**

Insert published posts before and after the current time. Assert public list/detail queries exclude the future post. Assert admin status filtering returns exactly draft or published rows.

- [ ] **Step 2: Run the tests and verify the future post leaks**

Run: `pnpm test tests/integration/posts.test.ts`

Expected: FAIL because published queries only check non-null `publishedAt`.

- [ ] **Step 3: Fix repository publication semantics**

Use `lte(posts.publishedAt, now())` for public list and detail queries. Add optional admin status filtering without adding a search parameter or search UI.

- [ ] **Step 4: Build authenticated true preview**

The preview route validates the admin session, loads any draft by ID, renders with `renderMarkdownSafe`, and uses the same article structure/classes as the public blog detail page.

- [ ] **Step 5: Replace the form footer with a fixed editorial toolbar**

Track dirty state. Provide `保存草稿`, `预览`, and `发布` for drafts; provide `更新`, `预览`, and `撤回为草稿` for published posts. A future `publishedAt` remains published in admin but unavailable publicly until due. Open preview only after saving the current draft successfully.

- [ ] **Step 6: Add status tabs and remove search language**

Read `?status=draft|published` in the list page, render “全部 / 草稿 / 已发布”, and change the page description so it does not mention search.

- [ ] **Step 7: Run post tests and Astro checks**

Run: `pnpm test tests/integration/posts.test.ts`

Run: `pnpm check`

Expected: PASS.

- [ ] **Step 8: Commit blog workflow changes**

```powershell
git add src/server/repositories/posts.ts src/server/validation/post.ts src/components/admin/PostForm.astro src/components/admin/MarkdownEditor.astro src/pages/admin/posts src/pages/api/admin/posts tests/integration/posts.test.ts
git commit -m "feat: improve blog publishing workflow"
```

### Task 7: Apply Mboker Img Branding and Quiet Studio Admin UI

**Files:**
- Modify: `src/styles/admin.scss`
- Modify: `src/layouts/AdminLayout.astro`
- Modify: `src/components/admin/AdminSidebar.astro`
- Modify: `src/pages/admin/login.astro`
- Modify: `src/components/MainHead.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/config/site.ts`
- Modify: `src/server/repositories/settings.ts`
- Modify: `scripts/import-legacy-content.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `docker-compose.yml`
- Modify: `README.md`
- Test: `tests/unit/smoke.test.ts`

- [ ] **Step 1: Update the smoke test to require Mboker Img defaults**

```ts
expect(siteConfig.shortName).toBe('Mboker Img');
expect(siteConfig.name).toContain('Mboker Img');
```

- [ ] **Step 2: Run the smoke test and confirm the old brand fails**

Run: `pnpm test tests/unit/smoke.test.ts`

Expected: FAIL with a Tink value.

- [ ] **Step 3: Replace user-visible and fresh-install branding**

Use `Mboker Img` for navigation, admin titles, default SEO, imported settings, package name, README title, Compose service name, and container display name. Keep existing SQLite filenames and D-drive volume configuration compatible.

- [ ] **Step 4: Apply the approved admin tokens**

Define neutral white work surfaces, a deep green sidebar, `8px` panel radii, `6px` control radii, visible focus styles, and non-pill status labels. Keep tables compact, remove decorative card nesting, and ensure controls do not overflow at 390px.

- [ ] **Step 5: Run brand scans, smoke tests, and checks**

Run: `rg -n "Tink\.|Tink Photo Gallery|tinks-website|tink-photography" src scripts package.json docker-compose.yml README.md`

Expected: only intentional legacy URL/path references and historical attribution remain.

Run: `pnpm test tests/unit/smoke.test.ts && pnpm check`

Expected: PASS.

- [ ] **Step 6: Commit brand and UI changes**

```powershell
git add src/styles/admin.scss src/layouts/AdminLayout.astro src/components/admin/AdminSidebar.astro src/pages/admin/login.astro src/components/MainHead.astro src/components/Header.astro src/components/Footer.astro src/config/site.ts src/server/repositories/settings.ts scripts/import-legacy-content.ts package.json pnpm-lock.yaml docker-compose.yml README.md tests/unit/smoke.test.ts
git commit -m "feat: apply Mboker Img studio identity"
```

### Task 8: Replace the Paper.js Cursor with a Fail-Safe Native Cursor

**Files:**
- Modify: `src/functions/Cursor.astro`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Test: `tests/unit/cursor-source.test.ts`

- [ ] **Step 1: Write a source-level regression test**

Read `Cursor.astro` and assert it contains `pointermove`, `requestAnimationFrame`, and an initialization class; assert it does not contain `paper`, `cursor: none` on bare `html, body`, or a canvas.

- [ ] **Step 2: Run the test and confirm the Paper.js failure**

Run: `pnpm test tests/unit/cursor-source.test.ts`

Expected: FAIL because Paper.js and unconditional cursor hiding remain.

- [ ] **Step 3: Implement the native pointer loop**

Render a center dot and ring. On fine pointers with no reduced-motion preference, attach `pointermove`, interpolate ring coordinates in one animation frame, update the dot directly, and only then add `custom-cursor-ready` to the document root.

```css
html.custom-cursor-ready, html.custom-cursor-ready body { cursor: none; }
@media (pointer: coarse), (prefers-reduced-motion: reduce) { .mousePoint, .mouseRing { display: none; } }
```

Cleanup listeners, the animation frame, and root class on `astro:before-swap`.

- [ ] **Step 4: Remove Paper.js and run checks**

Run: `pnpm remove paper`

Run: `pnpm test tests/unit/cursor-source.test.ts && pnpm check`

Expected: PASS and no Paper.js import.

- [ ] **Step 5: Commit the cursor fix**

```powershell
git add src/functions/Cursor.astro package.json pnpm-lock.yaml tests/unit/cursor-source.test.ts
git commit -m "fix: keep visitor cursor visible"
```

### Task 9: Run the Focused Release Gate and Docker Verification

**Files:**
- Modify: `tests/integration/special-layout.test.ts`
- Modify: `tests/integration/photo-admin.test.ts`
- Modify: `tests/integration/posts.test.ts`
- Modify: `tests/integration/visitor-gallery.test.ts`
- Create: `output/playwright/mboker-admin-desktop.png`
- Create: `output/playwright/mboker-special-desktop.png`
- Create: `output/playwright/mboker-special-mobile.png`

- [ ] **Step 1: Run focused automated checks**

Run:

```powershell
pnpm test tests/unit/special-layout.test.ts tests/unit/cursor-source.test.ts tests/unit/smoke.test.ts tests/integration/special-layout.test.ts tests/integration/photo-admin.test.ts tests/integration/posts.test.ts tests/integration/visitor-gallery.test.ts
pnpm check
pnpm build
```

Expected: every command exits 0.

- [ ] **Step 2: Backfill the D-drive test database**

Run the migration and idempotent Altay backfill inside the project container with `DATABASE_PATH=/app/data/tink.sqlite`. Confirm the host volume resolves under the configured D-drive data directory before executing.

- [ ] **Step 3: Rebuild and start the real Compose service**

Run: `docker compose up -d --build`

Expected: the Mboker Img service becomes healthy and serves the configured host port while `/app/data` and `/app/backups` map to D-drive directories.

- [ ] **Step 4: Exercise critical browser flows**

Using Edge through Playwright CLI:

1. Log in.
2. Edit and save an existing photo without a page reload.
3. Add an external image.
4. Open Altay special layout, edit Markdown, add each block type, reorder, and save.
5. Preview desktop and mobile special pages.
6. Save a blog draft, preview it, publish it, and withdraw it.
7. Verify ordinary galleries still render.
8. Move the pointer over the visitor page and confirm the system or custom cursor remains visible with no CSP errors.

- [ ] **Step 5: Capture visual evidence**

Save desktop admin, desktop Altay, and 390px mobile Altay screenshots under `output/playwright/`. Confirm no blank images, overlapping text, horizontal overflow, clipped controls, or broken Markdown.

- [ ] **Step 6: Inspect the final diff and commit verification fixes**

Run: `git status --short`

Expected: only intentional source/test changes and ignored runtime artifacts. Do not stage `.playwright-cli/` or `output/` screenshots unless explicitly requested.

```powershell
git add tests src scripts package.json pnpm-lock.yaml docker-compose.yml README.md drizzle
git commit -m "test: verify Mboker Img publishing workflows"
```

- [ ] **Step 7: Configure and push GitHub only with a confirmed target**

Run: `git remote -v`

If no remote exists, obtain the target GitHub repository URL first. After the user supplies it, pass that exact URL as the final argument to `git remote add origin`, then run `git push -u origin codex/tink-cms`. Never guess the destination repository.

## Completion Criteria

- The five special-layout add actions work with upload and external album images.
- Arbitrary Markdown renders safely in full-width and split blocks.
- Altay is backfilled once and visually matches the original split feature direction.
- Ordinary galleries preserve their current layout.
- Blog draft, true preview, scheduled visibility, publish, update, and withdrawal work.
- Photo layout edits update without a full page reload and warn about special references.
- No admin search option exists.
- The approved quiet studio admin UI and Mboker Img branding are visible.
- Cursor initialization failure cannot hide the system pointer.
- Focused tests, production build, and Docker verification pass with persistent data on D drive.

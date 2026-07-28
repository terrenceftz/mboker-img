# Gallery Layout Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current single-image alignment authoritative and add configurable paired-image rows to ordinary galleries.

**Architecture:** Preserve imported fine-grained data in `photos.layoutJson`, but remove keys that conflict with fields edited in the CMS. Add paired-row metadata to the same JSON column, group adjacent photos in a pure helper, and render pairs through a dedicated Astro component while keeping special galleries unchanged.

**Tech Stack:** Astro 7, TypeScript, Drizzle ORM with SQLite, Zod, Vitest, Docker, Playwright CLI.

---

### Task 1: Make CMS layout fields authoritative

**Files:**
- Modify: `tests/integration/photo-admin.test.ts`
- Modify: `src/server/repositories/photos.ts`
- Modify: `src/components/gallery/DynamicGalleryImage.astro`
- Create: `tests/unit/gallery-layout-source.test.ts`

- [ ] **Step 1: Write the failing repository regression test**

Extend the existing “edits metadata and layout” test by seeding conflicting imported layout data and asserting that CMS-owned keys are removed while unrelated data survives:

```ts
layoutJson: {
  cols: { md: '4' },
  offset: { md: '2' },
  align: 'start',
  hasBackground: false,
  padding: '80px',
  class: 'legacy-layout',
  verticalAlign: 'end',
},
```

After changing the preset from `auto` to `wide`, assert:

```ts
expect(result.data.layoutJson).toEqual({ verticalAlign: 'end' });
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```powershell
pnpm vitest run tests/integration/photo-admin.test.ts
```

Expected: FAIL because `layoutJson` still contains imported `align`, background, padding, columns, offset, and class.

- [ ] **Step 3: Normalize conflicting layout JSON in the repository**

In `src/server/repositories/photos.ts`, load the current row before update and derive the stored JSON:

```ts
function currentLayoutJson(current: typeof photos.$inferSelect, values: PhotoChanges) {
  const layout = { ...(current.layoutJson ?? {}) };
  delete layout.align;
  delete layout.hasBackground;
  delete layout.padding;
  if (values.layoutPreset && values.layoutPreset !== current.layoutPreset) {
    delete layout.cols;
    delete layout.offset;
    delete layout.class;
  }
  return layout;
}
```

Set `layoutJson: currentLayoutJson(current, values)` in `updatePhoto`. Keep `updatePhotoLayoutsBatch` routed through the same function.

- [ ] **Step 4: Write the failing component-source test**

Create `tests/unit/gallery-layout-source.test.ts` and assert the component uses current database fields and margin alignment:

```ts
const source = await readFile('src/components/gallery/DynamicGalleryImage.astro', 'utf8');
expect(source).toContain('const align = photo.align;');
expect(source).toContain('const hasBackground = photo.hasBackground;');
expect(source).toContain('const padding = photo.padding;');
expect(source).toContain(".collection-item[data-align='center']");
expect(source).toContain('margin-inline: auto');
```

- [ ] **Step 5: Run the source test and verify RED**

Run `pnpm vitest run tests/unit/gallery-layout-source.test.ts`.

Expected: FAIL because imported JSON still overrides current fields and ordinary items have no margin rules.

- [ ] **Step 6: Correct single-image rendering**

In `DynamicGalleryImage.astro`, use:

```ts
const align = photo.align;
const hasBackground = photo.hasBackground;
const padding = photo.padding;
```

Add ordinary item positioning:

```css
.collection-item[data-align='start'] { margin-left: 0; margin-right: auto; }
.collection-item[data-align='center'] { margin-inline: auto; }
.collection-item[data-align='end'] { margin-left: auto; margin-right: 0; }
```

- [ ] **Step 7: Verify GREEN and commit**

Run:

```powershell
pnpm vitest run tests/integration/photo-admin.test.ts tests/unit/gallery-layout-source.test.ts
```

Expected: both files pass. Commit as `fix: honor current gallery alignment`.

### Task 2: Store paired-row controls

**Files:**
- Modify: `src/server/db/schema.ts`
- Modify: `src/pages/api/admin/photos/[id].ts`
- Modify: `src/server/repositories/photos.ts`
- Modify: `src/components/admin/PhotoGrid.astro`
- Modify: `src/components/admin/PhotoEditor.astro`
- Modify: `tests/integration/photo-admin.test.ts`
- Create: `tests/unit/photo-editor-source.test.ts`

- [ ] **Step 1: Write failing API assertions for pair metadata**

Patch a photo with:

```ts
pairWithNext: true,
pairRatio: '2:3',
verticalAlign: 'center',
```

Assert the response contains:

```ts
layoutJson: expect.objectContaining({
  pairWithNext: true,
  pairRatio: '2:3',
  verticalAlign: 'center',
}),
```

- [ ] **Step 2: Run the API test and verify RED**

Run `pnpm vitest run tests/integration/photo-admin.test.ts`.

Expected: FAIL with validation error because the PATCH schema does not accept pair fields.

- [ ] **Step 3: Add typed pair metadata and validated persistence**

Extend `StoredPhotoLayout`:

```ts
pairWithNext?: boolean;
pairRatio?: '1:1' | '2:3' | '3:2';
verticalAlign?: 'start' | 'center' | 'end';
```

Extend `photoInput` with defaults:

```ts
pairWithNext: z.boolean().default(false),
pairRatio: z.enum(['1:1', '2:3', '3:2']).default('1:1'),
verticalAlign: z.enum(['start', 'center', 'end']).default('start'),
```

In the repository, separate these values from database columns and merge them into the normalized `layoutJson`. Delete `pairRatio` when `pairWithNext` is false, but retain `verticalAlign` for use when the image becomes the second item in a pair.

- [ ] **Step 4: Write the failing editor-source test**

Assert `PhotoEditor.astro` includes labels and payload keys for `与下一张同排`, `宽度比例`, `垂直对齐`, `pairWithNext`, `pairRatio`, and `verticalAlign`.

- [ ] **Step 5: Run the editor test and verify RED**

Run `pnpm vitest run tests/unit/photo-editor-source.test.ts`.

Expected: FAIL because controls are absent.

- [ ] **Step 6: Add editor controls and last-photo guard**

Add a pair checkbox, a conditional segmented ratio control, and vertical alignment select to `PhotoEditor.astro`. Include the three fields in the PATCH body.

In `PhotoGrid.astro`, include whether a photo has a following sibling and is not already the second member of a pair when dispatching `photo:edit`:

```ts
canPairWithNext: index < photos.length - 1 && !photos[index - 1]?.layoutJson?.pairWithNext,
```

Disable the pair checkbox and clear it when `canPairWithNext` is false. Show ratio controls only while the pair checkbox is checked.

- [ ] **Step 7: Verify GREEN and commit**

Run:

```powershell
pnpm vitest run tests/integration/photo-admin.test.ts tests/unit/photo-editor-source.test.ts
```

Expected: both files pass. Commit as `feat: add paired gallery controls`.

### Task 3: Group and render paired photos

**Files:**
- Create: `src/server/gallery/group-photos.ts`
- Create: `tests/unit/group-gallery-photos.test.ts`
- Create: `src/components/gallery/PairedGalleryRow.astro`
- Modify: `src/components/gallery/DynamicGalleryImage.astro`
- Modify: `src/pages/collection/[category]/[album].astro`
- Modify: `tests/unit/gallery-layout-source.test.ts`

- [ ] **Step 1: Write failing grouping tests**

Cover a normal list, a valid pair, a final photo with `pairWithNext`, and a second photo that also has the flag:

```ts
expect(groupGalleryPhotos([first, second, third])).toEqual([
  { type: 'pair', first, second },
  { type: 'single', photo: third },
]);
```

Assert the final unmatched photo becomes `{ type: 'single' }`.

- [ ] **Step 2: Run grouping tests and verify RED**

Run `pnpm vitest run tests/unit/group-gallery-photos.test.ts`.

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the pure grouping helper**

Create a generic helper that walks once through the ordered array:

```ts
export function groupGalleryPhotos<T extends { layoutJson?: StoredPhotoLayout }>(items: T[]) {
  const groups: GalleryPhotoGroup<T>[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const first = items[index]!;
    const second = items[index + 1];
    if (first.layoutJson?.pairWithNext && second) {
      groups.push({ type: 'pair', first, second });
      index += 1;
    } else {
      groups.push({ type: 'single', photo: first });
    }
  }
  return groups;
}
```

- [ ] **Step 4: Write failing renderer-source assertions**

Assert the album page calls `groupGalleryPhotos`, renders `PairedGalleryRow`, and that the pair component contains CSS grid ratios and a mobile single-column media query.

- [ ] **Step 5: Run renderer tests and verify RED**

Run `pnpm vitest run tests/unit/gallery-layout-source.test.ts`.

Expected: FAIL because the pair component and grouping call are absent.

- [ ] **Step 6: Implement paired-row rendering**

Add a `paired` rendering mode to `DynamicGalleryImage.astro` so it omits Bootstrap columns and ordinary item margins while reusing responsive picture markup.

Create `PairedGalleryRow.astro` with:

```css
.paired-row { display:grid; gap:clamp(28px,8vw,150px); margin-bottom:12vw; }
.paired-row[data-ratio='1:1'] { grid-template-columns:1fr 1fr; }
.paired-row[data-ratio='2:3'] { grid-template-columns:2fr 3fr; }
.paired-row[data-ratio='3:2'] { grid-template-columns:3fr 2fr; }
.paired-slot[data-vertical-align='start'] { align-self:start; }
.paired-slot[data-vertical-align='center'] { align-self:center; }
.paired-slot[data-vertical-align='end'] { align-self:end; }
@media (max-width:767px) { .paired-row { grid-template-columns:1fr !important; gap:40px; } }
```

Update the ordinary album page to group photos and render singles or pairs. Do not change `SpecialGallery.astro`.

- [ ] **Step 7: Verify gallery tasks and commit**

Run:

```powershell
pnpm vitest run tests/integration/photo-admin.test.ts tests/unit/gallery-layout-source.test.ts tests/unit/group-gallery-photos.test.ts tests/unit/photo-editor-source.test.ts
```

Expected: all targeted tests pass. Commit as `feat: render paired gallery rows`.

### Task 4: Verify gallery behavior

**Files:**
- No production changes expected

- [ ] **Step 1: Run complete automated checks**

Run `pnpm test` and `pnpm check` using Node `>=22.12`.

Expected: all tests pass and Astro reports zero errors.

- [ ] **Step 2: Rebuild Docker without deleting mounted data**

Run `docker compose up -d --build`. Do not run `docker compose down -v` and do not delete `D:/Docker/mboker-img/data` or backups.

- [ ] **Step 3: Verify with Playwright CLI**

At desktop and mobile widths, verify one ordinary album has visibly distinct left, center, and right single-image positions. In the admin, pair two adjacent photos with ratio `2:3`, set different vertical alignment values, save, and verify the public row preserves natural image ratios and stacks on mobile.

- [ ] **Step 4: Commit verification-only fixes if required**

If browser verification finds a scoped defect, add a regression test first, fix it, rerun the relevant checks, and commit as `fix: polish gallery layout behavior`.

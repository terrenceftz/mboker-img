# Gallery Preloader Montage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's fixed preloader portrait with a five-frame montage sampled from published gallery photos.

**Architecture:** A focused repository module queries eligible photo URLs and provides a deterministic random-selection helper. The homepage selects five URLs per server request and passes them through the existing layout to the preloader, while the existing runtime waits for the final montage frame before revealing the page.

**Tech Stack:** Astro 7, TypeScript, Drizzle ORM, SQLite, Vitest, GSAP, SCSS

---

### Task 1: Published Gallery Image Selection

**Files:**
- Create: `src/server/repositories/preloader.ts`
- Create: `tests/unit/preloader-gallery.test.ts`
- Create: `tests/integration/preloader-gallery.test.ts`

- [ ] **Step 1: Write failing selector tests**

Create unit tests that call `selectPreloaderImages` with a deterministic random function and assert that five unique candidates are shuffled without duplication, short candidate lists repeat to five frames, duplicate URLs are removed, and an empty list produces five `/hero-preloader.jpg` frames.

```ts
expect(selectPreloaderImages(['/a.jpg', '/b.jpg'], 5, () => 0)).toEqual([
  '/b.jpg', '/a.jpg', '/b.jpg', '/a.jpg', '/b.jpg',
]);
expect(selectPreloaderImages([], 5, () => 0)).toEqual(Array(5).fill('/hero-preloader.jpg'));
```

- [ ] **Step 2: Run selector tests and verify RED**

Run: `pnpm vitest run tests/unit/preloader-gallery.test.ts`

Expected: FAIL because `src/server/repositories/preloader.ts` does not exist.

- [ ] **Step 3: Implement deterministic selection**

Add `selectPreloaderImages(candidates, count = 5, random = Math.random)` using a de-duplicated Fisher-Yates shuffle. Return a repeated shuffled list until `count` frames exist; return repeated `/hero-preloader.jpg` frames when no candidate exists.

```ts
export function selectPreloaderImages(
  candidates: string[],
  count = 5,
  random: () => number = Math.random,
) {
  if (count <= 0) return [];
  const shuffled = [...new Set(candidates.filter(Boolean))];
  if (!shuffled.length) return Array(count).fill('/hero-preloader.jpg');
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.floor(random() * (index + 1)));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return Array.from({ length: count }, (_, index) => shuffled[index % shuffled.length]!);
}
```

- [ ] **Step 4: Run selector tests and verify GREEN**

Run: `pnpm vitest run tests/unit/preloader-gallery.test.ts`

Expected: all selector tests PASS.

- [ ] **Step 5: Write failing published-photo query test**

Seed published and draft categories/albums with uploaded and external photos. Assert `listPublishedPreloaderImageUrls` returns only photos whose category and album are both published, prefers `thumbnailUrl`, and falls back to `originalUrl`.

```ts
expect(listPublishedPreloaderImageUrls(testDatabase.db)).toEqual([
  '/media/published-thumb.webp',
  'https://images.example.com/external.jpg',
]);
```

- [ ] **Step 6: Run query test and verify RED**

Run: `pnpm vitest run tests/integration/preloader-gallery.test.ts`

Expected: FAIL because `listPublishedPreloaderImageUrls` is not exported.

- [ ] **Step 7: Implement the published-photo query**

Join `photos`, `albums`, and `categories`, filter both statuses to `published`, order by photo ID for stable inputs, and map each record to `thumbnailUrl ?? originalUrl`.

```ts
export function listPublishedPreloaderImageUrls(db: CmsDatabase) {
  return db
    .select({ thumbnailUrl: photos.thumbnailUrl, originalUrl: photos.originalUrl })
    .from(photos)
    .innerJoin(albums, eq(photos.albumId, albums.id))
    .innerJoin(categories, eq(albums.categoryId, categories.id))
    .where(and(eq(albums.status, 'published'), eq(categories.status, 'published')))
    .orderBy(asc(photos.id))
    .all()
    .map((photo) => photo.thumbnailUrl ?? photo.originalUrl);
}
```

- [ ] **Step 8: Run both tests and commit**

Run: `pnpm vitest run tests/unit/preloader-gallery.test.ts tests/integration/preloader-gallery.test.ts`

Expected: both files PASS.

Commit: `git commit -m "feat: select published preloader photos"`

### Task 2: Pass Five Images Into the Homepage Preloader

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/functions/Preloader.astro`
- Modify: `tests/unit/preloader-asset-source.test.ts`

- [ ] **Step 1: Replace the fixed-asset test with failing montage assertions**

Assert the homepage calls both repository helpers, `Layout.astro` accepts and forwards `preloaderImages`, and `Preloader.astro` renders a `.preloader-montage` by mapping its `images` prop rather than using a fixed `src="/hero-preloader.jpg"`.

- [ ] **Step 2: Run the component source test and verify RED**

Run: `pnpm vitest run tests/unit/preloader-asset-source.test.ts`

Expected: FAIL because the fixed preloader image is still present.

- [ ] **Step 3: Query and pass the selected images**

In `src/pages/index.astro`, compute:

```ts
const preloaderImages = selectPreloaderImages(listPublishedPreloaderImageUrls(db));
```

Pass `preloaderImages` to `Layout`. Add `preloaderImages?: string[]` to the layout props and pass it to `<Preloader images={preloaderImages} />` only for the homepage montage.

```astro
---
import { listPublishedPreloaderImageUrls, selectPreloaderImages } from '../server/repositories/preloader';
const preloaderImages = selectPreloaderImages(listPublishedPreloaderImageUrls(db));
---
<Layout page="home" preloaderImages={preloaderImages}>
```

```astro
interface Props {
  page?: string;
  title?: string;
  keywords?: string;
  description?: string;
  loading?: string;
  preloaderImages?: string[];
}
const { page, title, keywords, description, loading, preloaderImages = [] } = Astro.props;
<Preloader loading={loading} showHero={page === 'home'} images={preloaderImages} />
```

- [ ] **Step 4: Render the montage structure and responsive styling**

In `Preloader.astro`, render five decorative images in a centered `.preloader-montage`, set `loading="eager"` and `decoding="async"`, and use `object-fit: cover`. Add staggered `preloader-montage-in` keyframes with per-card translation and rotation, plus a compact mobile frame size and `preloader-montage-out` styles for `.is-leaving`.

```astro
{showHero ? (
  <div class="preloader-montage" aria-hidden="true">
    {images.map((src, index) => (
      <img
        src={src}
        class="preloader-montage__image"
        style={`--montage-index: ${index}`}
        alt=""
        loading="eager"
        decoding="async"
      />
    ))}
  </div>
) : (
  <div class="preloader-title preloader-splitting" data-splitting>{loading}</div>
)}
```

```scss
.preloader-montage { position: relative; width: 240px; height: 300px; }
.preloader-montage__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  animation: preloader-montage-in .8s cubic-bezier(.16, 1, .3, 1) calc(.15s + var(--montage-index) * .14s) both;
}
.preloader-montage.is-leaving .preloader-montage__image {
  animation: preloader-montage-out .45s ease-in both;
}
@media (max-width: 600px) { .preloader-montage { width: 168px; height: 210px; } }
```

- [ ] **Step 5: Run the component test and commit**

Run: `pnpm vitest run tests/unit/preloader-asset-source.test.ts`

Expected: PASS.

Commit: `git commit -m "feat: render gallery preloader montage"`

### Task 3: Synchronize the Existing Page Reveal

**Files:**
- Modify: `src/components/PreloaderRuntime.astro`
- Modify: `tests/unit/preloader-asset-source.test.ts`

- [ ] **Step 1: Add failing runtime assertions**

Assert the runtime selects `.preloader-montage`, listens for `preloader-montage-in` on its last frame, adds `.is-leaving`, and retains a timeout fallback.

- [ ] **Step 2: Run the source test and verify RED**

Run: `pnpm vitest run tests/unit/preloader-asset-source.test.ts`

Expected: FAIL because the runtime still targets `.preloader-hero`.

- [ ] **Step 3: Update the runtime**

Replace the single hero state with montage state. Mark the intro complete when the last card's `preloader-montage-in` animation ends, call `reveal()`, and use a 1700 ms timeout fallback. During reveal, add `.is-leaving` before the current three preloader layers animate upward.

```ts
const montage = preloader?.querySelector('.preloader-montage');
const lastFrame = montage?.querySelector('.preloader-montage__image:last-child');
let montageIntroComplete = !montage;
if (montage) {
  const finishMontageIntro = () => {
    montageIntroComplete = true;
    reveal();
  };
  lastFrame?.addEventListener('animationend', (event) => {
    if ((event as AnimationEvent).animationName === 'preloader-montage-in') finishMontageIntro();
  });
  window.setTimeout(finishMontageIntro, 1700);
}
```

Gate `reveal()` with `if (montage && (!pageReady || !montageIntroComplete)) return;` and call `montage.classList.add('is-leaving')` before the existing GSAP layer timeline.

- [ ] **Step 4: Run focused tests and commit**

Run: `pnpm vitest run tests/unit/preloader-gallery.test.ts tests/integration/preloader-gallery.test.ts tests/unit/preloader-asset-source.test.ts`

Expected: all focused tests PASS.

Commit: `git commit -m "fix: synchronize montage preloader reveal"`

### Task 4: Production Verification

**Files:**
- Modify only if verification exposes a defect in the files above.

- [ ] **Step 1: Run project verification**

Run: `pnpm test`

Expected: all tests PASS.

Run: `pnpm build`

Expected: Astro check reports zero errors and the production build exits successfully.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 2: Rebuild Docker and smoke test**

Rebuild the existing Docker service without deleting volumes. Confirm `http://localhost:4321/` returns HTTP 200.

- [ ] **Step 3: Verify in a real browser**

Open the homepage at desktop and `390x844` mobile sizes. Confirm five overlapping gallery frames animate before the page reveal, no frame overflows the viewport, the homepage remains visible after the preloader exits, and the console contains no new errors.

- [ ] **Step 4: Final commit and push**

Stage only intended project files, excluding `.playwright-cli/` and `output/`. Commit any verification fixes, then push `codex/tink-cms` to the configured GitHub remote.

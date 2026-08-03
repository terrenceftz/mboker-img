# Homepage Gallery Cover Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the original nine-position asymmetric homepage gallery while preventing individual covers from becoming excessively large on wide desktop screens.

**Architecture:** Add per-position desktop width and viewport-aware height bounds while leaving the grid tracks unchanged. Let the inner wrapper, media link, picture, and image shrink to intrinsic proportions so portrait covers stay bounded without cropping and detached labels remain adjacent. Protect the behavior with a focused source regression test, then verify rendered dimensions in a real browser at wide desktop and mobile widths.

**Tech Stack:** Astro 7, SCSS, Vitest, Playwright CLI, Docker

---

### Task 1: Add a failing cover-size regression test

**Files:**
- Create: `tests/unit/index-card-source.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('homepage gallery card sizing', () => {
  const source = readFileSync('src/components/IndexCard.astro', 'utf8');

  it('uses independent desktop caps for the nine asymmetric card positions', () => {
    const expectedCaps = [900, 440, 620, 860, 600, 520, 840, 600, 900];

    expectedCaps.forEach((width, index) => {
      const position = index + 1;
      expect(source).toContain(
        `.index-card:nth-child(9n + ${position}) .index-card__inner { max-width: ${width}px; }`,
      );
    });
  });

  it('preserves complete images without fixed-height cropping', () => {
    expect(source).toMatch(/\.index-card__img\s*\{[^}]*height:\s*auto/s);
    expect(source).not.toMatch(/\.index-card__img\s*\{[^}]*(?:object-fit:\s*cover|aspect-ratio:)/s);
  });

  it('bounds portrait covers by height while preserving intrinsic proportions', () => {
    const expectedHeightCaps = [760, 620, 700, 760, 700, 720, 760, 800, 900];

    expect(source).toMatch(/@media \(min-width: 992px\)[\s\S]*\.index-card__inner,[\s\S]*width:\s*auto;[\s\S]*max-width:\s*100%;/);
    expect(source).toMatch(/@media \(min-width: 992px\)[\s\S]*\.index-card__img\s*\{[^}]*width:\s*auto;/);
    expectedHeightCaps.forEach((height, index) => {
      const position = index + 1;
      expect(source).toContain(
        `.index-card:nth-child(9n + ${position}) .index-card__img { max-height: min(${height}px, 78vh); }`,
      );
    });
  });
});
```

- [ ] **Step 2: Run the test and verify the size-cap case fails**

Run:

```powershell
docker compose run --rm mboker-img pnpm exec vitest run tests/unit/index-card-source.test.ts
```

Expected: one test fails because the nine independent `max-width` rules do not exist; the no-cropping test passes.

- [ ] **Step 3: Commit the failing test**

```powershell
git add tests/unit/index-card-source.test.ts
git commit -m "test: cover homepage gallery sizing"
```

### Task 2: Add independent desktop size limits

**Files:**
- Modify: `src/components/IndexCard.astro`
- Test: `tests/unit/index-card-source.test.ts`

- [ ] **Step 1: Add per-position limits inside the existing desktop media query**

Add the following rules inside `@media (min-width: 992px)` before the information-position rules:

```scss
.index-card:nth-child(9n + 1) .index-card__inner { max-width: 900px; }
.index-card:nth-child(9n + 2) .index-card__inner { max-width: 440px; }
.index-card:nth-child(9n + 3) .index-card__inner { max-width: 620px; }
.index-card:nth-child(9n + 4) .index-card__inner { max-width: 860px; }
.index-card:nth-child(9n + 5) .index-card__inner { max-width: 600px; }
.index-card:nth-child(9n + 6) .index-card__inner { max-width: 520px; }
.index-card:nth-child(9n + 7) .index-card__inner { max-width: 840px; }
.index-card:nth-child(9n + 8) .index-card__inner { max-width: 600px; }
.index-card:nth-child(9n + 9) .index-card__inner { max-width: 900px; }

.index-card__inner,
.index-card__media,
.index-card__media .gsap-picture {
  display: inline-block;
  width: auto;
  max-width: 100%;
}
.index-card__img { width: auto; }
.index-card:nth-child(9n + 1) .index-card__img { max-height: min(760px, 78vh); }
.index-card:nth-child(9n + 2) .index-card__img { max-height: min(620px, 78vh); }
.index-card:nth-child(9n + 3) .index-card__img { max-height: min(700px, 78vh); }
.index-card:nth-child(9n + 4) .index-card__img { max-height: min(760px, 78vh); }
.index-card:nth-child(9n + 5) .index-card__img { max-height: min(700px, 78vh); }
.index-card:nth-child(9n + 6) .index-card__img { max-height: min(720px, 78vh); }
.index-card:nth-child(9n + 7) .index-card__img { max-height: min(760px, 78vh); }
.index-card:nth-child(9n + 8) .index-card__img { max-height: min(800px, 78vh); }
.index-card:nth-child(9n + 9) .index-card__img { max-height: min(900px, 78vh); }
```

Do not modify `.index-grid__inner`, homepage hero selectors, grid columns, or information transforms.

- [ ] **Step 2: Run the focused test and verify both cases pass**

Run:

```powershell
docker compose run --rm mboker-img pnpm exec vitest run tests/unit/index-card-source.test.ts
```

Expected: 1 test file passes, 3 tests pass, 0 failures.

- [ ] **Step 3: Run related homepage regression tests**

Run:

```powershell
docker compose run --rm mboker-img pnpm exec vitest run tests/unit/index-card-source.test.ts tests/unit/home-navigation-source.test.ts tests/integration/home-data.test.ts
```

Expected: all selected test files pass with 0 failures.

- [ ] **Step 4: Commit the implementation**

```powershell
git add src/components/IndexCard.astro
git commit -m "fix: constrain homepage gallery covers"
```

### Task 3: Verify the rendered layout

**Files:**
- Verify: `src/components/IndexCard.astro`

- [ ] **Step 1: Rebuild and start the Docker service**

Run:

```powershell
docker compose up -d --build
```

Expected: image builds successfully and the `mboker-img` container starts on `http://localhost:4321/`.

- [ ] **Step 2: Check the wide desktop card dimensions**

Open the homepage at a `2560 x 1440` viewport and evaluate all `.index-card__img` rectangles.

Expected:

- The first card width is at most 900px.
- Every card height is at most 78% of the viewport height and its position-specific pixel cap.
- The nine-card cycle contains at least three distinct rendered widths.
- Every card's rendered width-to-height ratio matches its natural image ratio within 0.02, proving no crop.
- The detached title/date labels remain beside their associated images.

- [ ] **Step 3: Check the mobile layout**

Open the homepage at a `390 x 844` viewport.

Expected:

- `document.documentElement.scrollWidth - innerWidth` equals `0`.
- Gallery images use the available mobile width.
- No title, date, or image overlaps another card.

- [ ] **Step 4: Run the final source checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only intentional source changes or known ignored/untracked browser artifacts remain.

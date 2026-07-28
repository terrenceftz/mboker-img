# Special Layout Editor UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore styling on dynamically generated special-layout blocks and give every editor block consistent, responsive dimensions.

**Architecture:** Keep the current JavaScript rendering and editing workflow. Expose only the dynamic block selectors through Astro `:global(...)`, then tighten the existing CSS so the canvas, headers, controls, media slots, and Markdown panes use stable dimensions.

**Tech Stack:** Astro 7 scoped CSS, TypeScript, Vitest source regression tests, Playwright CLI.

---

### Task 1: Repair and normalize dynamic editor styling

**Files:**
- Create: `tests/unit/special-layout-editor-source.test.ts`
- Modify: `src/components/admin/SpecialLayoutEditor.astro`

- [ ] **Step 1: Write the failing source regression test**

Create a test that reads the Astro component and proves dynamic selectors are globally scoped while geometry is stable:

```ts
const source = readFileSync('src/components/admin/SpecialLayoutEditor.astro', 'utf8');

expect(source).toContain(':global(.special-block-card)');
expect(source).toContain(':global(.special-block-content)');
expect(source).toContain(':global(.special-image-slot)');
expect(source).toContain(':global(.special-markdown textarea)');
expect(source).toMatch(/:global\(\.special-block-card\)[^{]*\{[^}]*width:\s*100%/s);
expect(source).toMatch(/:global\(\.special-block-card > header\)[^{]*\{[^}]*min-height:\s*52px/s);
expect(source).toMatch(/:global\(\.special-block-actions button\)[^{]*\{[^}]*min-height:\s*32px/s);
expect(source).toMatch(/:global\(\.special-image-slot img\)[^{]*\{[^}]*object-fit:\s*contain/s);
expect(source).toContain('grid-template-columns: 1fr !important');
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm vitest run tests/unit/special-layout-editor-source.test.ts
```

Expected: FAIL because the dynamically inserted block selectors remain Astro-scoped.

- [ ] **Step 3: Make dynamic selectors global and normalize dimensions**

Leave toolbar and dialog selectors scoped because those nodes are rendered by Astro. Wrap selectors for classes produced inside `render()`, `blockBody()`, and `imageSlot()` with `:global(...)`.

Use these stable rules:

```css
:global(.special-block-list) { display:grid; width:100%; gap:14px; }
:global(.special-block-card) { width:100%; min-width:0; overflow:hidden; border:1px solid #d7ddd9; border-radius:8px; background:#fff; }
:global(.special-block-card > header) { display:flex; min-height:52px; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid #e2e6e3; }
:global(.special-block-actions button) { min-width:44px; min-height:32px; }
:global(.special-block-content) { display:grid; width:100%; min-width:0; gap:14px; padding:16px; }
:global(.special-image-slot) { width:100%; min-width:0; min-height:clamp(180px,24vw,320px); }
:global(.special-image-slot img) { display:block; width:100%; max-height:420px; object-fit:contain; }
:global(.special-markdown textarea), :global(.special-markdown-preview) { width:100%; min-height:220px; }
```

Keep two-column ratio selectors global. In the mobile media query, make the split one column, allow header actions to wrap, and preserve 32px action controls.

- [ ] **Step 4: Run targeted tests and Astro check**

Run:

```powershell
pnpm vitest run tests/unit/special-layout-editor-source.test.ts tests/unit/special-layout.test.ts tests/integration/special-layout.test.ts
pnpm check
```

Expected: all tests pass and Astro reports zero errors.

- [ ] **Step 5: Verify visually and commit**

Use Playwright CLI at desktop and mobile widths. Confirm all rendered block cards have equal available width, controls use consistent heights, image previews are contained, and Markdown areas do not overflow. Commit as `fix: normalize special layout editor UI`.


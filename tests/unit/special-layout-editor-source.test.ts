import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('special layout editor dynamic UI', () => {
  it('globally styles generated blocks with stable responsive dimensions', () => {
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
  });
});

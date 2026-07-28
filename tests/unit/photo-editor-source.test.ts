import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('photo editor paired-row controls', () => {
  it('edits pairing, ratio, and vertical alignment with a last-photo guard', () => {
    const editor = readFileSync('src/components/admin/PhotoEditor.astro', 'utf8');
    const grid = readFileSync('src/components/admin/PhotoGrid.astro', 'utf8');

    expect(editor).toContain('与下一张同排');
    expect(editor).toContain('宽度比例');
    expect(editor).toContain('垂直对齐');
    expect(editor).toContain('pairWithNext');
    expect(editor).toContain('pairRatio');
    expect(editor).toContain('verticalAlign');
    expect(editor).toContain('canPairWithNext');
    expect(grid).toContain('canPairWithNext');
    expect(grid).toContain('layoutJson?.pairWithNext');
  });
});

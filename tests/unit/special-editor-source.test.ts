import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('special layout editor', () => {
  it('offers five block actions, reorder controls, preview modes, and dirty-state protection', async () => {
    const source = await readFile('src/components/admin/SpecialLayoutEditor.astro', 'utf8');

    for (const label of ['通栏图片', '通栏文字', '左图右文', '左文右图', '双图']) {
      expect(source).toContain(label);
    }
    expect(source).toContain("from 'sortablejs'");
    expect(source).toContain('beforeunload');
    expect(source).toContain('data-preview-mode="desktop"');
    expect(source).toContain('data-preview-mode="mobile"');
    expect(source).toContain('data-move="up"');
    expect(source).toContain('data-move="down"');
  });
});

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('post publishing workflow source', () => {
  it('provides explicit save, preview, publish, and withdraw actions with dirty-state protection', () => {
    const source = readFileSync('src/components/admin/PostForm.astro', 'utf8');

    expect(source).toContain('保存草稿');
    expect(source).toContain('预览');
    expect(source).toContain('发布');
    expect(source).toContain('撤回为草稿');
    expect(source).toContain('beforeunload');
  });

  it('uses status tabs without a search control', () => {
    const source = readFileSync('src/pages/admin/posts/index.astro', 'utf8');

    expect(source).toContain('status=draft');
    expect(source).toContain('status=published');
    expect(source).not.toMatch(/type=["']search["']/i);
    expect(source).not.toContain('data-search');
    expect(source).not.toContain('搜索');
  });

  it('has an authenticated visitor-style preview route', () => {
    const source = readFileSync('src/pages/admin/posts/[id]/preview.astro', 'utf8');

    expect(source).toContain('renderMarkdownSafe');
    expect(source).toContain('getPostById');
    expect(source).toContain('BaseLayout');
  });
});

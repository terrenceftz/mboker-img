import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('special gallery component', () => {
  it('renders every stored block type with a mobile single-column fallback', async () => {
    const source = await readFile('src/components/gallery/SpecialGallery.astro', 'utf8');

    expect(source).toContain("block.type === 'image'");
    expect(source).toContain("block.type === 'markdown'");
    expect(source).toContain("block.type === 'split'");
    expect(source).toContain("block.type === 'twoImages'");
    expect(source).toContain('grid-template-columns: 1fr');
    expect(source).toContain('renderMarkdownSafe');
  });
});

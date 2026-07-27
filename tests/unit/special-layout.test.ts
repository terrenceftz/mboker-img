import { describe, expect, it } from 'vitest';

import { specialLayoutInput } from '../../src/server/validation/special-layout';

describe('special layout validation', () => {
  it('accepts every supported block shape and arbitrary long Markdown', () => {
    const markdown = '# Altay\n\n' + 'long text '.repeat(2_000);
    const parsed = specialLayoutInput.parse({
      version: 1,
      blocks: [
        { id: 'hero', type: 'image', photoId: 7 },
        { id: 'story', type: 'markdown', markdown },
        {
          id: 'intro',
          type: 'split',
          direction: 'image-text',
          ratio: '2:3',
          verticalAlign: 'center',
          photoId: 8,
          markdown: '# Journey',
        },
        {
          id: 'reverse',
          type: 'split',
          direction: 'text-image',
          ratio: '3:2',
          verticalAlign: 'end',
          photoId: 9,
          markdown: 'Closing notes',
        },
        { id: 'pair', type: 'twoImages', ratio: '1:1', leftPhotoId: 10, rightPhotoId: 11 },
      ],
    });

    expect(parsed.blocks).toHaveLength(5);
    expect(parsed.blocks[2]).toMatchObject({ type: 'split', photoId: 8, ratio: '2:3' });
    expect(parsed.blocks[1]).toMatchObject({ type: 'markdown', markdown });
  });

  it('rejects duplicate block ids', () => {
    const result = specialLayoutInput.safeParse({
      version: 1,
      blocks: [
        { id: 'same', type: 'image', photoId: 1 },
        { id: 'same', type: 'markdown', markdown: 'Duplicate' },
      ],
    });

    expect(result.success).toBe(false);
  });

  it.each([
    [{ id: 'bad-photo', type: 'image', photoId: 0 }],
    [{ id: 'bad-ratio', type: 'twoImages', ratio: '4:1', leftPhotoId: 1, rightPhotoId: 2 }],
    [{ id: 'nested', type: 'group', blocks: [] }],
    [{ id: 'too-long', type: 'markdown', markdown: 'x'.repeat(200_001) }],
    Array.from({ length: 201 }, (_, index) => ({ id: `block-${index}`, type: 'image', photoId: index + 1 })),
  ])('rejects unsupported or oversized documents', (blocks) => {
    expect(specialLayoutInput.safeParse({ version: 1, blocks }).success).toBe(false);
  });
});

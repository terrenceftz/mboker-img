import { z } from 'zod';

const blockId = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/);
const photoId = z.coerce.number().int().positive();
const markdown = z.string().max(200_000);
const ratio = z.enum(['1:1', '2:3', '3:2']);

export const specialBlockInput = z.discriminatedUnion('type', [
  z.object({ id: blockId, type: z.literal('image'), photoId }),
  z.object({ id: blockId, type: z.literal('markdown'), markdown }),
  z.object({
    id: blockId,
    type: z.literal('split'),
    direction: z.enum(['image-text', 'text-image']),
    ratio,
    verticalAlign: z.enum(['start', 'center', 'end']),
    photoId,
    markdown,
  }),
  z.object({
    id: blockId,
    type: z.literal('twoImages'),
    ratio,
    leftPhotoId: photoId,
    rightPhotoId: photoId,
  }),
]);

export const specialLayoutInput = z
  .object({
    version: z.literal(1),
    blocks: z.array(specialBlockInput).max(200),
  })
  .superRefine((layout, context) => {
    const ids = new Set<string>();
    layout.blocks.forEach((block, index) => {
      if (ids.has(block.id)) {
        context.addIssue({
          code: 'custom',
          message: '区块 ID 不能重复',
          path: ['blocks', index, 'id'],
        });
      }
      ids.add(block.id);
    });
  });

export const specialAlbumInput = z.object({
  isSpecial: z.boolean(),
  layout: specialLayoutInput,
});

export type SpecialLayoutInput = z.infer<typeof specialLayoutInput>;

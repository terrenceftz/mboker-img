import { z } from 'zod';

export const siteMediaKeySchema = z.enum(['category-cover', 'post-cover', 'about-portrait']);

export const mediaScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('album'), id: z.coerce.number().int().positive() }),
  z.object({ kind: z.literal('site'), key: siteMediaKeySchema }),
]);

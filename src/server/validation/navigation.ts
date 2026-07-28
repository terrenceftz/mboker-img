import { z } from 'zod';

export const navigationInput = z.object({
  albumIds: z.array(z.number().int().positive()).refine(
    (ids) => new Set(ids).size === ids.length,
    '图集不能重复',
  ),
}).strict();

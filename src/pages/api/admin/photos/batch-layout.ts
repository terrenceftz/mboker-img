import type { APIRoute } from 'astro';
import { z } from 'zod';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { updatePhotoLayoutsBatch } from '../../../../server/repositories/photos';

const batchLayoutInput = z.object({
  albumId: z.coerce.number().int().positive(),
  ids: z.array(z.coerce.number().int().positive()).min(1).max(500),
  layoutPreset: z.enum(['auto', 'wide', 'standard', 'narrow']),
  align: z.enum(['start', 'center', 'end']),
  hasBackground: z.boolean(),
  padding: z.string().trim().max(80),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = batchLayoutInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { albumId, ids, ...layout } = parsed.data;
    return apiData(updatePhotoLayoutsBatch(db, albumId, ids, layout));
  } catch (error) {
    return repositoryError(error);
  }
};

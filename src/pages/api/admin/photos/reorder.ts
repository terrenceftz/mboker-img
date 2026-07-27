import type { APIRoute } from 'astro';
import { z } from 'zod';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { getAlbumById } from '../../../../server/repositories/albums';
import { reorderPhotos } from '../../../../server/repositories/photos';

const reorderInput = z.object({
  albumId: z.coerce.number().int().positive(),
  ids: z.array(z.coerce.number().int().positive()).refine((ids) => new Set(ids).size === ids.length, '图片 ID 不能重复'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = reorderInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    getAlbumById(db, parsed.data.albumId);
    return apiData(reorderPhotos(db, parsed.data.albumId, parsed.data.ids));
  } catch (error) {
    return repositoryError(error);
  }
};

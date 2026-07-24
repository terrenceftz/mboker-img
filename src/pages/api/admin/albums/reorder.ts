import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { reorderAlbums } from '../../../../server/repositories/albums';
import { getCategoryById } from '../../../../server/repositories/categories';
import { albumReorderInput } from '../../../../server/validation/album';

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = albumReorderInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    getCategoryById(db, parsed.data.categoryId);
    return apiData(reorderAlbums(db, parsed.data.categoryId, parsed.data.ids));
  } catch (error) {
    return repositoryError(error);
  }
};

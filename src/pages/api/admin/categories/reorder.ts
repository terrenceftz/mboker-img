import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { reorderCategories } from '../../../../server/repositories/categories';
import { categoryReorderInput } from '../../../../server/validation/category';

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = categoryReorderInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    return apiData(reorderCategories(db, parsed.data.ids));
  } catch (error) {
    return repositoryError(error);
  }
};

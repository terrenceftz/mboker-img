import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, invalidId, parseId, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { deleteCategory, updateCategory } from '../../../../server/repositories/categories';
import { categoryInput } from '../../../../server/validation/category';

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();

  const parsed = categoryInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    return apiData(updateCategory(db, id, parsed.data));
  } catch (error) {
    return repositoryError(error);
  }
};

export const DELETE: APIRoute = ({ cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();

  try {
    return apiData(deleteCategory(db, id));
  } catch (error) {
    return repositoryError(error);
  }
};

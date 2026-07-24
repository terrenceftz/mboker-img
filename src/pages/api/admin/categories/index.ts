import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { createCategory, listCategoriesAdmin } from '../../../../server/repositories/categories';
import { categoryInput } from '../../../../server/validation/category';

export const GET: APIRoute = ({ cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  return apiData(listCategoriesAdmin(db));
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = categoryInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const sortOrder = listCategoriesAdmin(db).length;
    return apiData(createCategory(db, { ...parsed.data, sortOrder }), 201);
  } catch (error) {
    return repositoryError(error);
  }
};

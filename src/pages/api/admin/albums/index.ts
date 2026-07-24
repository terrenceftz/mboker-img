import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { createAlbum, listAlbumsAdmin } from '../../../../server/repositories/albums';
import { getCategoryById } from '../../../../server/repositories/categories';
import { albumInput } from '../../../../server/validation/album';

export const GET: APIRoute = ({ cookies, url }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const categoryId = url.searchParams.has('categoryId') ? Number(url.searchParams.get('categoryId')) : undefined;
  return apiData(listAlbumsAdmin(db, Number.isInteger(categoryId) ? categoryId : undefined));
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = albumInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    getCategoryById(db, parsed.data.categoryId);
    const sortOrder = listAlbumsAdmin(db, parsed.data.categoryId).length;
    const { tags, seoKeywords, ...values } = parsed.data;
    return apiData(createAlbum(db, { ...values, tagsJson: tags, seoKeywordsJson: seoKeywords, sortOrder }), 201);
  } catch (error) {
    return repositoryError(error);
  }
};

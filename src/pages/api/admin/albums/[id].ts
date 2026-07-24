import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, invalidId, parseId, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { deleteAlbum, updateAlbum } from '../../../../server/repositories/albums';
import { getCategoryById } from '../../../../server/repositories/categories';
import { albumInput } from '../../../../server/validation/album';

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();

  const parsed = albumInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    getCategoryById(db, parsed.data.categoryId);
    const { tags, seoKeywords, ...values } = parsed.data;
    return apiData(updateAlbum(db, id, { ...values, tagsJson: tags, seoKeywordsJson: seoKeywords }));
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
    return apiData(deleteAlbum(db, id));
  } catch (error) {
    return repositoryError(error);
  }
};

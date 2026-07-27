import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../../server/db/client';
import {
  apiData,
  invalidId,
  parseId,
  readJson,
  repositoryError,
  requireAdmin,
  validationError,
} from '../../../../../server/http/admin-api';
import { getAlbumById, saveSpecialLayout } from '../../../../../server/repositories/albums';
import { listPhotos } from '../../../../../server/repositories/photos';
import { specialAlbumInput } from '../../../../../server/validation/special-layout';

export const GET: APIRoute = ({ cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();
  try {
    return apiData({ album: getAlbumById(db, id), photos: listPhotos(db, id) });
  } catch (error) {
    return repositoryError(error);
  }
};

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();
  const parsed = specialAlbumInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  try {
    return apiData(saveSpecialLayout(db, id, parsed.data));
  } catch (error) {
    return repositoryError(error);
  }
};

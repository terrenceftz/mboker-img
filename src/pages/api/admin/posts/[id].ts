import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, invalidId, parseId, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { deletePost, updatePost } from '../../../../server/repositories/posts';
import { postInput, postValues } from '../../../../server/validation/post';

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();
  const parsed = postInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  try {
    return apiData(updatePost(db, id, postValues(parsed.data)));
  } catch (error) {
    return repositoryError(error);
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();
  try {
    return apiData(deletePost(db, id));
  } catch (error) {
    return repositoryError(error);
  }
};

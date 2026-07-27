import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { createPost, listPostsAdmin } from '../../../../server/repositories/posts';
import { postInput, postValues } from '../../../../server/validation/post';

export const GET: APIRoute = async ({ cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  return unauthorized ?? apiData(listPostsAdmin(db));
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const parsed = postInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  try {
    return apiData(createPost(db, postValues(parsed.data)), 201);
  } catch (error) {
    return repositoryError(error);
  }
};

import type { APIRoute } from 'astro';

import { getDatabase } from '../../../server/db/client';
import { apiData, readJson, requireAdmin, validationError } from '../../../server/http/admin-api';
import { getAbout, upsertAbout } from '../../../server/repositories/about';
import { aboutInput } from '../../../server/validation/about';

export const GET: APIRoute = async ({ cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  return unauthorized ?? apiData(getAbout(db));
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const parsed = aboutInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  return apiData(upsertAbout(db, parsed.data));
};

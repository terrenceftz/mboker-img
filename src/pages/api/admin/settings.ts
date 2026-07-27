import type { APIRoute } from 'astro';

import { getDatabase } from '../../../server/db/client';
import { apiData, readJson, requireAdmin, validationError } from '../../../server/http/admin-api';
import { getSettings, upsertSettings } from '../../../server/repositories/settings';
import { settingsInput } from '../../../server/validation/settings';

export const GET: APIRoute = async ({ cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  return unauthorized ?? apiData(getSettings(db));
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const parsed = settingsInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  return apiData(upsertSettings(db, parsed.data));
};

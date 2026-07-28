import type { APIRoute } from 'astro';

import { getDatabase } from '../../../server/db/client';
import { apiData, readJson, requireAdmin, validationError } from '../../../server/http/admin-api';
import { filterExistingAlbumIds } from '../../../server/repositories/navigation';
import { getSettings, upsertSettings } from '../../../server/repositories/settings';
import { navigationInput } from '../../../server/validation/navigation';

export const GET: APIRoute = async ({ cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  return apiData(getSettings(db)?.navigationJson ?? null);
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = navigationInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const navigationJson = {
    version: 1 as const,
    albumIds: filterExistingAlbumIds(db, parsed.data.albumIds),
  };
  upsertSettings(db, { navigationJson });
  return apiData(navigationJson);
};

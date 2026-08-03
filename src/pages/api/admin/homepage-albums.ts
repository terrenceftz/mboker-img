import type { APIRoute } from 'astro';

import { getDatabase } from '../../../server/db/client';
import { apiData, readJson, requireAdmin, validationError } from '../../../server/http/admin-api';
import { listHomepageAlbumIds, replaceHomepageAlbums } from '../../../server/repositories/albums';
import { filterExistingAlbumIds } from '../../../server/repositories/navigation';
import { navigationInput } from '../../../server/validation/navigation';

export const GET: APIRoute = ({ cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  return apiData({ albumIds: listHomepageAlbumIds(db) });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = navigationInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const albumIds = filterExistingAlbumIds(db, parsed.data.albumIds);
  replaceHomepageAlbums(db, albumIds);
  return apiData({ albumIds });
};

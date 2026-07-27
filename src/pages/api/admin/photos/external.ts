import type { APIRoute } from 'astro';
import { z } from 'zod';

import { getDatabase } from '../../../../server/db/client';
import { apiData, apiError, readJson, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { validateExternalImageUrl } from '../../../../server/media/external';
import { getAlbumById } from '../../../../server/repositories/albums';
import { createExternalPhoto, listPhotos } from '../../../../server/repositories/photos';
import type { CmsDatabase } from '../../../../server/repositories/shared';

const externalInput = z.object({
  albumId: z.coerce.number().int().positive(),
  urls: z.array(z.string().trim().min(1)).min(1).max(30),
  alts: z.array(z.string().trim().max(500)).max(30).default([]),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  const parsed = externalInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    getAlbumById(db, parsed.data.albumId);
    const normalized = parsed.data.urls.map(validateExternalImageUrl);
    const startOrder = listPhotos(db, parsed.data.albumId).length;
    const created = db.transaction((tx: CmsDatabase) => normalized.map((originalUrl, index) => createExternalPhoto(tx, {
      albumId: parsed.data.albumId,
      originalUrl,
      variantsJson: {},
      thumbnailUrl: null,
      width: null,
      height: null,
      alt: parsed.data.alts[index] ?? '',
      sortOrder: startOrder + index,
      layoutPreset: 'auto',
      align: 'center',
      hasBackground: false,
      padding: '',
      layoutJson: {},
    })));
    return apiData(created, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '外链图片保存失败。';
    const status = message.includes('Album not found') ? 404 : 422;
    return apiError(status, status === 404 ? 'NOT_FOUND' : 'INVALID_IMAGE_URL', status === 404 ? '图集不存在。' : message);
  }
};

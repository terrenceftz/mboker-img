import type { APIRoute } from 'astro';
import { z } from 'zod';

import { getDatabase } from '../../../../server/db/client';
import { apiData, apiError, invalidId, parseId, readJson, repositoryError, requireAdmin, validationError } from '../../../../server/http/admin-api';
import { getUploadRoot } from '../../../../server/media/paths';
import { removeLocalMedia } from '../../../../server/media/remove';
import { getAlbumById, updateAlbum } from '../../../../server/repositories/albums';
import { countSpecialLayoutReferences, deletePhoto, getPhotoById, updatePhoto } from '../../../../server/repositories/photos';
import type { CmsDatabase } from '../../../../server/repositories/shared';

const photoInput = z.object({
  alt: z.string().trim().max(500),
  layoutPreset: z.enum(['auto', 'wide', 'standard', 'narrow']),
  align: z.enum(['start', 'center', 'end']),
  hasBackground: z.boolean(),
  padding: z.string().trim().max(80),
  pairWithNext: z.boolean().default(false),
  pairRatio: z.enum(['1:1', '2:3', '3:2']).default('1:1'),
  verticalAlign: z.enum(['start', 'center', 'end']).default('start'),
  setCover: z.boolean().optional().default(false),
});

export const GET: APIRoute = async ({ cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();

  try {
    const photo = getPhotoById(db, id);
    const album = getAlbumById(db, photo.albumId);
    return apiData({
      photo,
      isCover: album.coverPhotoId === photo.id,
      specialReferenceCount: countSpecialLayoutReferences(db, id),
    });
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

  const parsed = photoInput.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const updated = db.transaction((tx: CmsDatabase) => {
      const current = getPhotoById(tx, id);
      const { setCover, ...values } = parsed.data;
      const photo = updatePhoto(tx, id, values);
      if (setCover) updateAlbum(tx, current.albumId, { coverPhotoId: current.id });
      return { ...photo, isCover: setCover };
    });
    return apiData(updated);
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
    const photo = getPhotoById(db, id);
    if (photo.sourceType === 'upload') {
      const removed = await removeLocalMedia(getUploadRoot(), photo.originalUrl);
      if (!removed) return apiError(500, 'MEDIA_CLEANUP_FAILED', '无法清理本地图片文件，请检查上传目录权限后重试。');
    }
    const deleted = db.transaction((tx: CmsDatabase) => {
      const current = getPhotoById(tx, id);
      const album = getAlbumById(tx, current.albumId);
      if (album.coverPhotoId === current.id) updateAlbum(tx, album.id, { coverPhotoId: null });
      return deletePhoto(tx, id);
    });
    return apiData(deleted);
  } catch (error) {
    return repositoryError(error);
  }
};

import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../server/db/client';
import { apiData, apiError, requireAdmin } from '../../../../server/http/admin-api';
import { getUploadRoot } from '../../../../server/media/paths';
import { removeLocalMedia } from '../../../../server/media/remove';
import { MediaUploadError, processUpload } from '../../../../server/media/upload';
import { getAlbumById } from '../../../../server/repositories/albums';
import { createUploadedPhoto, listPhotos } from '../../../../server/repositories/photos';
import type { CmsDatabase } from '../../../../server/repositories/shared';

const MAX_FILES_PER_BATCH = 30;

function albumIdFromForm(form: FormData) {
  const id = Number(form.get('albumId'));
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(422, 'VALIDATION_ERROR', '请使用图片上传表单提交。');
  }

  const albumId = albumIdFromForm(form);
  if (!albumId) return apiError(422, 'VALIDATION_ERROR', '请选择有效的图集。', { albumId: ['请选择有效的图集'] });

  const files = form.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return apiError(422, 'VALIDATION_ERROR', '请至少选择一张图片。', { files: ['请选择图片'] });
  if (files.length > MAX_FILES_PER_BATCH) return apiError(413, 'TOO_MANY_FILES', `一次最多上传 ${MAX_FILES_PER_BATCH} 张图片。`);

  try {
    getAlbumById(db, albumId);
  } catch {
    return apiError(404, 'NOT_FOUND', '图集不存在。');
  }

  const altValues = form.getAll('alts').map((value) => String(value).trim());
  const completed = [] as Awaited<ReturnType<typeof processUpload>>[];
  const uploadRoot = getUploadRoot();

  try {
    for (const file of files) {
      completed.push(await processUpload(file, { kind: 'album', id: albumId }));
    }

    const startOrder = listPhotos(db, albumId).length;
    const created = db.transaction((tx: CmsDatabase) => completed.map((media, index) => createUploadedPhoto(tx, {
      albumId,
      originalUrl: media.originalUrl,
      variantsJson: media.variants,
      thumbnailUrl: media.thumbnailUrl,
      width: media.width,
      height: media.height,
      alt: altValues[index] ?? '',
      sortOrder: startOrder + index,
      layoutPreset: 'auto',
      align: 'center',
      hasBackground: false,
      padding: '',
      layoutJson: {},
    })));

    return apiData(created, 201);
  } catch (error) {
    await Promise.allSettled(completed.map((media) => removeLocalMedia(uploadRoot, media.originalUrl)));
    const status = error instanceof MediaUploadError ? error.status : 422;
    const detail = error instanceof Error ? error.message : '图片处理失败';
    return apiError(status, 'UPLOAD_FAILED', `上传失败：${detail}`);
  }
};

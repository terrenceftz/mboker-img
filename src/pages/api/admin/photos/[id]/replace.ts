import type { APIRoute } from 'astro';

import { getDatabase } from '../../../../../server/db/client';
import { apiData, apiError, invalidId, parseId, readJson, repositoryError, requireAdmin } from '../../../../../server/http/admin-api';
import { validateExternalImageUrl } from '../../../../../server/media/external';
import { getUploadRoot } from '../../../../../server/media/paths';
import { removeLocalMedia } from '../../../../../server/media/remove';
import { MediaUploadError, processUpload } from '../../../../../server/media/upload';
import { getPhotoById, replacePhotoMedia } from '../../../../../server/repositories/photos';

export const POST: APIRoute = async ({ request, cookies, params }) => {
  const db = getDatabase();
  const unauthorized = requireAdmin(cookies, db);
  if (unauthorized) return unauthorized;
  const id = parseId(params.id);
  if (!id) return invalidId();

  let current;
  try {
    current = getPhotoById(db, id);
  } catch (error) {
    return repositoryError(error);
  }

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  let replacement;
  let newLocalUrl: string | undefined;

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.size < 1) {
        return apiError(422, 'VALIDATION_ERROR', '请选择用于替换的图片文件。');
      }
      const media = await processUpload(file, { kind: 'album', id: current.albumId });
      newLocalUrl = media.originalUrl;
      replacement = {
        sourceType: 'upload' as const,
        originalUrl: media.originalUrl,
        variantsJson: media.variants,
        thumbnailUrl: media.thumbnailUrl,
        width: media.width,
        height: media.height,
        layoutPreset: media.automaticLayout,
      };
    } else {
      const body = await readJson(request) as { externalUrl?: unknown } | undefined;
      if (typeof body?.externalUrl !== 'string') {
        return apiError(422, 'VALIDATION_ERROR', '请输入用于替换的外链图片地址。');
      }
      replacement = {
        sourceType: 'external' as const,
        originalUrl: validateExternalImageUrl(body.externalUrl),
        variantsJson: {},
        thumbnailUrl: null,
        width: null,
        height: null,
        layoutPreset: current.layoutPreset,
      };
    }

    const updated = replacePhotoMedia(db, id, replacement);
    if (current.sourceType === 'upload' && current.originalUrl !== updated.originalUrl) {
      await removeLocalMedia(getUploadRoot(), current.originalUrl);
    }
    return apiData(updated);
  } catch (error) {
    if (newLocalUrl) await removeLocalMedia(getUploadRoot(), newLocalUrl);
    if (error instanceof MediaUploadError) return apiError(error.status, 'UPLOAD_FAILED', error.message);
    if (error instanceof Error) return apiError(422, 'REPLACE_FAILED', error.message);
    return apiError(422, 'REPLACE_FAILED', '替换图片失败，请重试。');
  }
};

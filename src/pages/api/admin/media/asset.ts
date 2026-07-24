import type { APIRoute } from 'astro';

import { getUploadRoot } from '../../../../server/media/paths';
import { MediaUploadError, processUpload } from '../../../../server/media/upload';
import { mediaScopeSchema } from '../../../../server/validation/media';

function badRequest(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData().catch(() => undefined);
  if (!formData) return badRequest('请使用 multipart/form-data 提交图片。');

  const file = formData.get('file');
  if (!(file instanceof File)) return badRequest('请选择一个图片文件。');

  const scope = mediaScopeSchema.safeParse(
    formData.get('scopeKind') === 'album'
      ? { kind: 'album', id: formData.get('scopeId') }
      : { kind: 'site', key: formData.get('siteKey') },
  );
  if (!scope.success) return badRequest('图片归属范围无效。');

  try {
    const uploaded = await processUpload(file, scope.data, { root: getUploadRoot() });
    return Response.json(uploaded, { status: 201 });
  } catch (error) {
    if (error instanceof MediaUploadError) return badRequest(error.message, error.status);
    return badRequest('图片处理失败，请确认文件是有效图片后重试。');
  }
};

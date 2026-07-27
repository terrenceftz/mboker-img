import type { ZodError } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/guard';
import { readSession } from '../auth/session';
import { RepositoryError } from '../repositories/shared';
import type { CmsDatabase } from '../repositories/shared';

type CookieReader = { get(name: string): { value: string } | undefined };

export function requireAdmin(cookies: CookieReader, db: CmsDatabase) {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !readSession(db, token)) {
    return apiError(401, 'UNAUTHORIZED', '需要登录。');
  }
}

export function apiData(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

export function apiError(status: number, code: string, message: string, fields?: Record<string, string[]>) {
  return Response.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function validationError(error: ZodError) {
  return apiError(422, 'VALIDATION_ERROR', '请检查表单内容。', error.flatten().fieldErrors as Record<string, string[]>);
}

export function invalidId() {
  return apiError(422, 'VALIDATION_ERROR', '资源 ID 无效。', { id: ['资源 ID 无效'] });
}

export function repositoryError(error: unknown) {
  if (!(error instanceof RepositoryError)) throw error;

  switch (error.code) {
    case 'NOT_FOUND':
      return apiError(404, error.code, '资源不存在。');
    case 'SLUG_CONFLICT':
      return apiError(409, error.code, '该 slug 已被使用。', { slug: ['该 slug 已被使用'] });
    case 'CATEGORY_NOT_EMPTY':
      return apiError(409, error.code, '请先移动或删除分类中的图集。');
    case 'INVALID_ORDER':
      return apiError(422, error.code, '排序数据不完整。');
    case 'PHOTO_NOT_IN_ALBUM':
      return apiError(409, error.code, '特辑只能使用当前图集中的图片。');
  }
}

export function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

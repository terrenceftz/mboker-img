import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { albums, categories } from '../../src/server/db/schema';
import { createTestDatabase } from '../helpers/database';

const state = vi.hoisted(() => ({ database: undefined as any }));

vi.mock('../../src/server/db/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/db/client')>()),
  getDatabase: () => state.database.db,
}));

vi.mock('../../src/server/auth/session', () => ({
  readSession: (_db: unknown, token: string) => (token === 'valid-session' ? { id: 1 } : undefined),
}));

import { DELETE as deleteAlbum, PATCH as updateAlbum } from '../../src/pages/api/admin/albums/[id]';
import { POST as createAlbum, GET as listAlbums } from '../../src/pages/api/admin/albums/index';
import { POST as reorderAlbums } from '../../src/pages/api/admin/albums/reorder';
import { DELETE as deleteCategory, PATCH as updateCategory } from '../../src/pages/api/admin/categories/[id]';
import { POST as createCategory, GET as listCategories } from '../../src/pages/api/admin/categories/index';
import { POST as reorderCategories } from '../../src/pages/api/admin/categories/reorder';

function context(
  method: string,
  path: string,
  body?: unknown,
  options: { authenticated?: boolean; params?: Record<string, string> } = {},
) {
  const authenticated = options.authenticated ?? true;
  const url = new URL(`http://localhost${path}`);
  return {
    request: new Request(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    params: options.params ?? {},
    cookies: {
      get: () => (authenticated ? { value: 'valid-session' } : undefined),
    },
  } as any;
}

async function responseJson(response: Response) {
  return response.json() as Promise<any>;
}

describe('category and album admin API', () => {
  beforeEach(async () => {
    state.database = await createTestDatabase();
  });

  afterEach(async () => {
    await state.database?.close();
    state.database = undefined;
  });

  it('rejects unauthenticated mutation requests', async () => {
    const response = await createCategory(
      context('POST', '/api/admin/categories', { title: 'Cities', slug: 'cities' }, { authenticated: false }),
    );

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('returns field errors for invalid category input', async () => {
    const response = await createCategory(context('POST', '/api/admin/categories', { title: '', slug: '' }));

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR', fields: { title: expect.any(Array), slug: expect.any(Array) } },
    });
  });

  it('creates, publishes, reorders, and deletes categories while normalizing slugs', async () => {
    const firstResponse = await createCategory(
      context('POST', '/api/admin/categories', { title: '城市', slug: '  CITY_Nights  ', status: 'draft' }),
    );
    const first = (await responseJson(firstResponse)).data;
    expect(firstResponse.status).toBe(201);
    expect(first.slug).toBe('city-nights');

    const duplicate = await createCategory(
      context('POST', '/api/admin/categories', { title: '重复', slug: 'City Nights' }),
    );
    expect(duplicate.status).toBe(409);
    expect(await responseJson(duplicate)).toMatchObject({ error: { code: 'SLUG_CONFLICT' } });

    const second = (
      await responseJson(
        await createCategory(context('POST', '/api/admin/categories', { title: '人像', slug: 'portrait' })),
      )
    ).data;
    const updated = await updateCategory(
      context(
        'PATCH',
        `/api/admin/categories/${first.id}`,
        { title: '城市纪实', slug: 'city-nights', status: 'published' },
        { params: { id: String(first.id) } },
      ),
    );
    expect(await responseJson(updated)).toMatchObject({ data: { title: '城市纪实', status: 'published' } });

    const reordered = await reorderCategories(
      context('POST', '/api/admin/categories/reorder', { ids: [second.id, first.id] }),
    );
    expect((await responseJson(reordered)).data.map((item: any) => item.id)).toEqual([second.id, first.id]);

    const deleted = await deleteCategory(
      context('DELETE', `/api/admin/categories/${second.id}`, undefined, { params: { id: String(second.id) } }),
    );
    expect(deleted.status).toBe(200);
    expect(state.database.db.select().from(categories).all()).toHaveLength(1);
  });

  it('blocks deletion of a category that still contains an album', async () => {
    const category = await state.database.seedCategory({ slug: 'travel' });
    await state.database.seedAlbum(category.id, { slug: 'hangzhou' });

    const response = await deleteCategory(
      context('DELETE', `/api/admin/categories/${category.id}`, undefined, { params: { id: String(category.id) } }),
    );

    expect(response.status).toBe(409);
    expect(await responseJson(response)).toMatchObject({ error: { code: 'CATEGORY_NOT_EMPTY' } });
  });

  it('creates, publishes, reorders, and deletes albums and reports slug conflicts', async () => {
    const category = await state.database.seedCategory({ title: '旅行', slug: 'travel' });
    const firstResponse = await createAlbum(
      context('POST', '/api/admin/albums', {
        categoryId: category.id,
        title: '杭州',
        slug: ' Hangzhou_2026 ',
        tags: ['城市', '夜景'],
        featured: true,
      }),
    );
    const first = (await responseJson(firstResponse)).data;
    expect(firstResponse.status).toBe(201);
    expect(first).toMatchObject({ slug: 'hangzhou-2026', categoryId: category.id, featured: true });

    const duplicate = await createAlbum(
      context('POST', '/api/admin/albums', { categoryId: category.id, title: '重复', slug: 'hangzhou 2026' }),
    );
    expect(duplicate.status).toBe(409);

    const second = (
      await responseJson(
        await createAlbum(
          context('POST', '/api/admin/albums', { categoryId: category.id, title: '苏州', slug: 'suzhou' }),
        ),
      )
    ).data;
    const updated = await updateAlbum(
      context(
        'PATCH',
        `/api/admin/albums/${first.id}`,
        { categoryId: category.id, title: '杭州夜景', slug: first.slug, status: 'published' },
        { params: { id: String(first.id) } },
      ),
    );
    expect(await responseJson(updated)).toMatchObject({ data: { title: '杭州夜景', status: 'published' } });

    const reordered = await reorderAlbums(
      context('POST', '/api/admin/albums/reorder', { categoryId: category.id, ids: [second.id, first.id] }),
    );
    expect((await responseJson(reordered)).data.map((item: any) => item.id)).toEqual([second.id, first.id]);

    const deleted = await deleteAlbum(
      context('DELETE', `/api/admin/albums/${second.id}`, undefined, { params: { id: String(second.id) } }),
    );
    expect(deleted.status).toBe(200);
    expect(state.database.db.select().from(albums).all()).toHaveLength(1);
  });

  it('returns 404 when an album category does not exist and lists persisted resources', async () => {
    const missingCategory = await createAlbum(
      context('POST', '/api/admin/albums', { categoryId: 9999, title: '海边', slug: 'coast' }),
    );
    expect(missingCategory.status).toBe(404);

    await state.database.seedCategory({ slug: 'documentary' });
    expect((await responseJson(await listCategories(context('GET', '/api/admin/categories')))).data).toHaveLength(1);
    expect((await responseJson(await listAlbums(context('GET', '/api/admin/albums')))).data).toHaveLength(0);
  });
});

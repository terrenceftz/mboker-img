import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { siteSettings } from '../../src/server/db/schema';
import { createTestDatabase } from '../helpers/database';

const state = vi.hoisted(() => ({ database: undefined as any }));

vi.mock('../../src/server/db/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/db/client')>()),
  getDatabase: () => state.database.db,
}));

vi.mock('../../src/server/auth/session', () => ({
  readSession: (_db: unknown, token: string) => token === 'valid-session' ? { id: 1 } : undefined,
}));

import { GET, PUT } from '../../src/pages/api/admin/navigation';

function context(method: string, body?: unknown, authenticated = true) {
  const url = new URL('http://localhost/api/admin/navigation');
  return {
    request: new Request(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    cookies: { get: () => authenticated ? { value: 'valid-session' } : undefined },
  } as any;
}

describe('navigation admin API', () => {
  beforeEach(async () => {
    state.database = await createTestDatabase();
  });

  afterEach(async () => {
    await state.database?.close();
    state.database = undefined;
  });

  it('requires an administrator session', async () => {
    expect((await GET(context('GET', undefined, false))).status).toBe(401);
    expect((await PUT(context('PUT', { albumIds: [] }, false))).status).toBe(401);
  });

  it('persists ordered selections and returns them', async () => {
    const category = await state.database.seedCategory();
    const first = await state.database.seedAlbum(category.id);
    const second = await state.database.seedAlbum(category.id);

    const saved = await PUT(context('PUT', { albumIds: [second.id, first.id] }));

    expect(saved.status).toBe(200);
    await expect(saved.json()).resolves.toEqual({
      data: { version: 1, albumIds: [second.id, first.id] },
    });
    await expect((await GET(context('GET'))).json()).resolves.toEqual({
      data: { version: 1, albumIds: [second.id, first.id] },
    });
  });

  it('rejects duplicate ids and preserves an explicit empty selection', async () => {
    const category = await state.database.seedCategory();
    const album = await state.database.seedAlbum(category.id);

    const duplicate = await PUT(context('PUT', { albumIds: [album.id, album.id] }));
    expect(duplicate.status).toBe(422);

    const empty = await PUT(context('PUT', { albumIds: [] }));
    expect(empty.status).toBe(200);
    expect(state.database.db.select().from(siteSettings).get()?.navigationJson).toEqual({
      version: 1,
      albumIds: [],
    });
  });

  it('filters deleted ids while retaining draft albums', async () => {
    const category = await state.database.seedCategory();
    const draft = await state.database.seedAlbum(category.id, { status: 'draft' });

    const response = await PUT(context('PUT', { albumIds: [999_999, draft.id] }));

    await expect(response.json()).resolves.toEqual({
      data: { version: 1, albumIds: [draft.id] },
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { albums } from '../../src/server/db/schema';
import { createTestDatabase } from '../helpers/database';

const state = vi.hoisted(() => ({ database: undefined as any }));

vi.mock('../../src/server/db/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/db/client')>()),
  getDatabase: () => state.database.db,
}));

vi.mock('../../src/server/auth/session', () => ({
  readSession: (_db: unknown, token: string) => token === 'valid-session' ? { id: 1 } : undefined,
}));

import { GET, PUT } from '../../src/pages/api/admin/homepage-albums';

function context(method: string, body?: unknown, authenticated = true) {
  const url = new URL('http://localhost/api/admin/homepage-albums');
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

describe('homepage album selection API', () => {
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

  it('replaces the homepage selection using existing album ids', async () => {
    const category = await state.database.seedCategory();
    const first = await state.database.seedAlbum(category.id, { featured: true });
    const second = await state.database.seedAlbum(category.id, { featured: false });

    const response = await PUT(context('PUT', { albumIds: [second.id, 999_999] }));

    await expect(response.json()).resolves.toEqual({ data: { albumIds: [second.id] } });
    expect(state.database.db.select().from(albums).all().map((album: typeof albums.$inferSelect) => ({
      id: album.id,
      featured: album.featured,
    }))).toEqual([
      { id: first.id, featured: false },
      { id: second.id, featured: true },
    ]);
    await expect((await GET(context('GET'))).json()).resolves.toEqual({ data: { albumIds: [second.id] } });
  });

  it('rejects duplicate ids and supports clearing the homepage', async () => {
    const category = await state.database.seedCategory();
    const album = await state.database.seedAlbum(category.id, { featured: true });

    expect((await PUT(context('PUT', { albumIds: [album.id, album.id] }))).status).toBe(422);
    expect((await PUT(context('PUT', { albumIds: [] }))).status).toBe(200);
    expect(state.database.db.select().from(albums).get()?.featured).toBe(false);
  });
});

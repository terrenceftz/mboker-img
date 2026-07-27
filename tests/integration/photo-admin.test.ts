import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { albums, photos } from '../../src/server/db/schema';
import { createTestDatabase } from '../helpers/database';

const state = vi.hoisted(() => ({
  database: undefined as any,
  uploadRoot: 'C:/tmp/tink-photo-admin-tests',
  processUpload: vi.fn(),
  removeLocalMedia: vi.fn(),
}));

vi.mock('../../src/server/db/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/db/client')>()),
  getDatabase: () => state.database.db,
}));

vi.mock('../../src/server/auth/session', () => ({
  readSession: (_db: unknown, token: string) => (token === 'valid-session' ? { id: 1 } : undefined),
}));

vi.mock('../../src/server/media/paths', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/media/paths')>()),
  getUploadRoot: () => state.uploadRoot,
}));

vi.mock('../../src/server/media/upload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/server/media/upload')>()),
  processUpload: state.processUpload,
}));

vi.mock('../../src/server/media/remove', () => ({
  removeLocalMedia: state.removeLocalMedia,
}));

import { DELETE as deletePhoto, PATCH as updatePhoto } from '../../src/pages/api/admin/photos/[id]';
import { DELETE as deleteAlbum } from '../../src/pages/api/admin/albums/[id]';
import { POST as createExternalPhotos } from '../../src/pages/api/admin/photos/external';
import { POST as reorderPhotos } from '../../src/pages/api/admin/photos/reorder';
import { POST as uploadPhotos } from '../../src/pages/api/admin/photos/upload';

function context(
  method: string,
  path: string,
  body?: unknown,
  options: { authenticated?: boolean; params?: Record<string, string> } = {},
) {
  const authenticated = options.authenticated ?? true;
  const url = new URL(`http://localhost${path}`);
  const isFormData = body instanceof FormData;
  return {
    request: new Request(url, {
      method,
      headers: body === undefined || isFormData ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    }),
    url,
    params: options.params ?? {},
    cookies: { get: () => (authenticated ? { value: 'valid-session' } : undefined) },
  } as any;
}

async function responseJson(response: Response) {
  return response.json() as Promise<any>;
}

async function seedAlbum() {
  const category = await state.database.seedCategory();
  return state.database.seedAlbum(category.id);
}

function uploadedMedia(index: number) {
  return {
    originalUrl: `/media/albums/1/upload_asset_${index}/original.jpg`,
    thumbnailUrl: `/media/albums/1/upload_asset_${index}/thumbnail-480.webp`,
    width: 1200,
    height: 800,
    variants: {
      webp: [{ width: 960, url: `/media/albums/1/upload_asset_${index}/image-960.webp` }],
      avif: [{ width: 960, url: `/media/albums/1/upload_asset_${index}/image-960.avif` }],
    },
    automaticLayout: 'standard' as const,
  };
}

describe('photo admin API', () => {
  beforeEach(async () => {
    state.database = await createTestDatabase();
    state.processUpload.mockReset();
    state.removeLocalMedia.mockReset().mockResolvedValue(true);
  });

  afterEach(async () => {
    await state.database?.close();
    state.database = undefined;
  });

  it('uploads one or many files and stores their generated variants in order', async () => {
    const album = await seedAlbum();
    state.processUpload
      .mockResolvedValueOnce(uploadedMedia(1))
      .mockResolvedValueOnce(uploadedMedia(2));
    const form = new FormData();
    form.set('albumId', String(album.id));
    form.append('files', new File(['first'], 'first.jpg', { type: 'image/jpeg' }));
    form.append('files', new File(['second'], 'second.jpg', { type: 'image/jpeg' }));
    form.append('alts', '第一张');
    form.append('alts', '第二张');

    const response = await uploadPhotos(context('POST', '/api/admin/photos/upload', form));
    const result = await responseJson(response);

    expect(response.status).toBe(201);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((photo: any) => photo.alt)).toEqual(['第一张', '第二张']);
    expect(result.data.map((photo: any) => photo.sortOrder)).toEqual([0, 1]);
    expect(result.data[0].variantsJson.webp).toHaveLength(1);
    expect(state.processUpload).toHaveBeenCalledTimes(2);
    expect(state.processUpload).toHaveBeenCalledWith(expect.any(File), { kind: 'album', id: album.id });
  });

  it('rolls back database rows and completed upload directories when a batch fails', async () => {
    const album = await seedAlbum();
    const first = uploadedMedia(1);
    state.processUpload.mockResolvedValueOnce(first).mockRejectedValueOnce(new Error('broken image'));
    const form = new FormData();
    form.set('albumId', String(album.id));
    form.append('files', new File(['first'], 'first.jpg', { type: 'image/jpeg' }));
    form.append('files', new File(['bad'], 'bad.jpg', { type: 'image/jpeg' }));

    const response = await uploadPhotos(context('POST', '/api/admin/photos/upload', form));

    expect(response.status).toBe(422);
    expect((await responseJson(response)).error.message).toContain('上传失败');
    expect(state.database.db.select().from(photos).all()).toHaveLength(0);
    expect(state.removeLocalMedia).toHaveBeenCalledWith(state.uploadRoot, first.originalUrl);
  });

  it('creates external image rows without fetching or generated variants', async () => {
    const album = await seedAlbum();
    const response = await createExternalPhotos(
      context('POST', '/api/admin/photos/external', {
        albumId: album.id,
        urls: [' HTTPS://images.example.com/a%20b.jpg ', 'https://cdn.example.com/two.png?size=large'],
        alts: ['远山', '海岸'],
      }),
    );
    const result = await responseJson(response);

    expect(response.status).toBe(201);
    expect(result.data.map((photo: any) => photo.originalUrl)).toEqual([
      'https://images.example.com/a%20b.jpg',
      'https://cdn.example.com/two.png?size=large',
    ]);
    expect(result.data.every((photo: any) => photo.sourceType === 'external')).toBe(true);
    expect(result.data.every((photo: any) => JSON.stringify(photo.variantsJson) === '{}')).toBe(true);
    expect(state.processUpload).not.toHaveBeenCalled();
  });

  it('edits metadata and layout, then sets a photo from the same album as cover', async () => {
    const album = await seedAlbum();
    const photo = state.database.db.insert(photos).values({
      albumId: album.id,
      originalUrl: 'https://images.example.com/photo.jpg',
      sourceType: 'external',
    }).returning().get();

    const response = await updatePhoto(context('PATCH', `/api/admin/photos/${photo.id}`, {
      alt: '新的说明',
      layoutPreset: 'wide',
      align: 'end',
      hasBackground: true,
      padding: '24px',
      setCover: true,
    }, { params: { id: String(photo.id) } }));
    const result = await responseJson(response);

    expect(response.status).toBe(200);
    expect(result.data).toMatchObject({
      alt: '新的说明', layoutPreset: 'wide', align: 'end', hasBackground: true, padding: '24px', isCover: true,
    });
    expect(state.database.db.select().from(albums).get().coverPhotoId).toBe(photo.id);
  });

  it('requires every album photo exactly once when reordering', async () => {
    const album = await seedAlbum();
    const first = state.database.db.insert(photos).values({ albumId: album.id, originalUrl: 'https://example.com/1.jpg' }).returning().get();
    const second = state.database.db.insert(photos).values({ albumId: album.id, originalUrl: 'https://example.com/2.jpg' }).returning().get();

    const invalid = await reorderPhotos(context('POST', '/api/admin/photos/reorder', { albumId: album.id, ids: [first.id] }));
    expect(invalid.status).toBe(422);

    const response = await reorderPhotos(context('POST', '/api/admin/photos/reorder', { albumId: album.id, ids: [second.id, first.id] }));
    expect(response.status).toBe(200);
    expect((await responseJson(response)).data.map((photo: any) => photo.id)).toEqual([second.id, first.id]);
  });

  it('cleans local derivatives on delete but never touches the filesystem for external URLs', async () => {
    const album = await seedAlbum();
    const local = state.database.db.insert(photos).values({
      albumId: album.id,
      sourceType: 'upload',
      originalUrl: '/media/albums/1/local_asset_123/original.jpg',
    }).returning().get();
    const external = state.database.db.insert(photos).values({
      albumId: album.id,
      sourceType: 'external',
      originalUrl: 'https://images.example.com/external.jpg',
    }).returning().get();

    const localResponse = await deletePhoto(context('DELETE', `/api/admin/photos/${local.id}`, undefined, { params: { id: String(local.id) } }));
    expect(localResponse.status).toBe(200);
    expect(state.removeLocalMedia).toHaveBeenCalledOnce();
    expect(state.removeLocalMedia).toHaveBeenCalledWith(state.uploadRoot, local.originalUrl);

    state.removeLocalMedia.mockClear();
    const externalResponse = await deletePhoto(context('DELETE', `/api/admin/photos/${external.id}`, undefined, { params: { id: String(external.id) } }));
    expect(externalResponse.status).toBe(200);
    expect(state.removeLocalMedia).not.toHaveBeenCalled();
    expect(state.database.db.select().from(photos).all()).toHaveLength(0);
  });

  it('clears the album cover reference when the cover photo is deleted', async () => {
    const album = await seedAlbum();
    const cover = state.database.db.insert(photos).values({
      albumId: album.id,
      sourceType: 'external',
      originalUrl: 'https://images.example.com/cover.jpg',
    }).returning().get();
    state.database.db.update(albums).set({ coverPhotoId: cover.id }).run();

    const response = await deletePhoto(
      context('DELETE', `/api/admin/photos/${cover.id}`, undefined, { params: { id: String(cover.id) } }),
    );

    expect(response.status).toBe(200);
    expect(state.database.db.select().from(albums).get().coverPhotoId).toBeNull();
  });

  it('cascades photo rows when their album is deleted', async () => {
    const album = await seedAlbum();
    state.database.db.insert(photos).values([
      { albumId: album.id, originalUrl: 'https://images.example.com/one.jpg', sourceType: 'external' },
      { albumId: album.id, originalUrl: 'https://images.example.com/two.jpg', sourceType: 'external' },
    ]).run();

    const response = await deleteAlbum(
      context('DELETE', `/api/admin/albums/${album.id}`, undefined, { params: { id: String(album.id) } }),
    );

    expect(response.status).toBe(200);
    expect(state.database.db.select().from(photos).all()).toHaveLength(0);
  });
});

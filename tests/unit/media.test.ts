import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import { validateExternalImageUrl } from '../../src/server/media/external';
import { scopePathSegments } from '../../src/server/media/paths';
import { serveMedia } from '../../src/server/media/serve';
import { chooseAutomaticLayout } from '../../src/server/media/types';
import { processUpload } from '../../src/server/media/upload';

const roots: string[] = [];

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), 'tink-media-'));
  roots.push(root);
  return root;
}

async function imageFile(width = 1200, height = 800, type = 'image/jpeg') {
  const bytes = await sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 30, b: 40 } },
  })
    .jpeg()
    .toBuffer();
  return new File([bytes], 'camera-name.jpg', { type });
}

function mediaPath(url: string) {
  return url.replace(/^\/media\//, '');
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('external images', () => {
  it('normalizes only credential-free HTTP(S) URLs without fetching', () => {
    expect(validateExternalImageUrl(' HTTPS://images.example.com/a%20b.jpg ')).toBe('https://images.example.com/a%20b.jpg');
    expect(() => validateExternalImageUrl('ftp://images.example.com/a.jpg')).toThrow(/http/i);
    expect(() => validateExternalImageUrl('https://user:pass@images.example.com/a.jpg')).toThrow(/凭据/);
    expect(() => validateExternalImageUrl('not a url')).toThrow(/URL/);
  });
});

describe('automatic layouts', () => {
  it('uses the documented aspect-ratio boundaries', () => {
    expect(chooseAutomaticLayout(160, 100)).toBe('wide');
    expect(chooseAutomaticLayout(159, 100)).toBe('standard');
    expect(chooseAutomaticLayout(80, 100)).toBe('narrow');
    expect(chooseAutomaticLayout(81, 100)).toBe('standard');
  });
});

describe('local media processing', () => {
  it('stores both homepage image roles in separate site directories', () => {
    expect(scopePathSegments({ kind: 'site', key: 'home-hero' })).toEqual(['site', 'home-hero']);
    expect(scopePathSegments({ kind: 'site', key: 'home-side' })).toEqual(['site', 'home-side']);
  });

  it('preserves the original and produces non-empty thumbnail and responsive formats', async () => {
    const root = await createRoot();
    const result = await processUpload(await imageFile(), { kind: 'album', id: 42 }, {
      root,
      id: () => 'asset_20260724_abcdef',
    });

    expect(result.width).toBe(1200);
    expect(result.height).toBe(800);
    expect(result.automaticLayout).toBe('standard');
    expect(result.originalUrl).toMatch(/^\/media\/albums\/42\/asset_20260724_abcdef\/original\.jpg$/);
    expect(result.thumbnailUrl).toMatch(/\/thumbnail-480\.webp$/);
    expect(result.variants.webp.map((entry) => entry.width)).toEqual([960, 1200]);
    expect(result.variants.avif.map((entry) => entry.width)).toEqual([960, 1200]);

    for (const url of [
      result.originalUrl,
      result.thumbnailUrl,
      ...result.variants.webp.map((entry) => entry.url),
      ...result.variants.avif.map((entry) => entry.url),
    ]) {
      expect((await stat(join(root, mediaPath(url)))).size).toBeGreaterThan(0);
    }
  });

  it('rolls back temporary and incomplete output after a derivative failure', async () => {
    const root = await createRoot();
    await expect(processUpload(await imageFile(), { kind: 'album', id: 7 }, {
      root,
      id: () => 'asset_failure_abcdef',
      onWrite: (stage) => {
        if (stage === 'thumbnail') throw new Error('injected thumbnail failure');
      },
    })).rejects.toThrow('injected thumbnail failure');

    await expect(stat(join(root, 'albums', '7', 'asset_failure_abcdef'))).rejects.toThrow();
  });
});

describe('local media delivery', () => {
  it('rejects traversal, serves valid files with safe image headers, and handles missing files', async () => {
    const root = await createRoot();
    const result = await processUpload(await imageFile(), { kind: 'site', key: 'post-cover' }, { root, id: () => 'asset_serve_abcdef' });

    const served = await serveMedia(root, mediaPath(result.thumbnailUrl));
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/webp');
    expect(served.headers.get('cache-control')).toContain('immutable');
    expect(served.headers.get('x-content-type-options')).toBe('nosniff');
    expect((await served.arrayBuffer()).byteLength).toBeGreaterThan(0);

    const head = await serveMedia(root, mediaPath(result.thumbnailUrl), 'HEAD');
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect((await serveMedia(root, '../secret.jpg')).status).toBe(404);
    expect((await serveMedia(root, '%2e%2e%2fsecret.jpg')).status).toBe(404);
    expect((await serveMedia(root, 'missing.webp')).status).toBe(404);
  });
});

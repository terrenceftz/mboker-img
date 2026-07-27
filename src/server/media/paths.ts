import { isAbsolute, relative, resolve } from 'node:path';

import type { StorageScope } from './types';

export const DEFAULT_UPLOAD_ROOT = 'data/uploads';

type SiteMediaKey = Extract<StorageScope, { kind: 'site' }>['key'];

const SITE_KEYS = new Set<SiteMediaKey>([
  'category-cover',
  'post-cover',
  'about-portrait',
  'home-hero',
  'home-side',
]);
const ASSET_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function getUploadRoot(root = process.env.UPLOAD_ROOT ?? DEFAULT_UPLOAD_ROOT) {
  return resolve(root);
}

export function assertAssetId(id: string) {
  if (!ASSET_ID_PATTERN.test(id)) throw new Error('Unsafe generated asset ID.');
  return id;
}

export function scopePathSegments(scope: StorageScope): string[] {
  if (scope.kind === 'album') {
    if (!Number.isSafeInteger(scope.id) || scope.id < 1) throw new Error('Invalid album storage scope.');
    return ['albums', String(scope.id)];
  }

  if (!SITE_KEYS.has(scope.key)) throw new Error('Invalid site storage scope.');
  return ['site', scope.key];
}

export function assetDirectory(root: string, scope: StorageScope, assetId: string) {
  return resolve(getUploadRoot(root), ...scopePathSegments(scope), assertAssetId(assetId));
}

export function assetMediaUrl(scope: StorageScope, assetId: string, filename: string) {
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) throw new Error('Unsafe media filename.');
  return `/media/${[...scopePathSegments(scope), assertAssetId(assetId), filename].join('/')}`;
}

export function isWithin(root: string, target: string) {
  const relativePath = relative(root, target);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

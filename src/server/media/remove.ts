import { realpath } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { rm } from 'node:fs/promises';

import { assertAssetId, getUploadRoot, isWithin } from './paths';

function assetPathFromUrl(originalUrl: string) {
  let url: URL;
  try {
    url = new URL(originalUrl, 'http://media.local');
  } catch {
    return undefined;
  }
  if (url.origin !== 'http://media.local' || url.search || url.hash || !url.pathname.startsWith('/media/')) return undefined;
  const rawPath = url.pathname.slice('/media/'.length);
  if (!rawPath || rawPath.includes('%') || rawPath.includes('\\')) return undefined;
  const parts = rawPath.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return undefined;

  if (parts.length === 4 && parts[0] === 'albums' && /^\d+$/.test(parts[1])) {
    try {
      assertAssetId(parts[2]);
      return parts.slice(0, 3);
    } catch {
      return undefined;
    }
  }
  if (parts.length === 4 && parts[0] === 'site' && [
    'category-cover',
    'post-cover',
    'about-portrait',
    'home-hero',
    'home-side',
  ].includes(parts[1])) {
    try {
      assertAssetId(parts[2]);
      return parts.slice(0, 3);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function removeLocalMedia(root: string, originalUrl: string) {
  const assetParts = assetPathFromUrl(originalUrl);
  if (!assetParts) return false;

  try {
    const resolvedRoot = await realpath(getUploadRoot(root));
    const assetDirectory = await realpath(dirname(`${resolvedRoot}/${assetParts.join('/')}/file`));
    if (!isWithin(resolvedRoot, assetDirectory) || relative(resolvedRoot, assetDirectory).split(/[\\/]/).length !== 3) return false;
    await rm(assetDirectory, { recursive: true, force: false });
    return true;
  } catch {
    return false;
  }
}

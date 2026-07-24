import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { Readable } from 'node:stream';

import { getUploadRoot, isWithin } from './paths';

const IMAGE_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function invalidPath(rawPath: string) {
  if (!rawPath || rawPath.includes('\\') || rawPath.includes('%') || rawPath.includes('\0')) return true;
  const parts = rawPath.split('/');
  return parts.some((part) => !part || part === '.' || part === '..');
}

export async function resolveMediaFile(root: string, rawPath: string) {
  if (invalidPath(rawPath)) return undefined;

  const contentType = IMAGE_TYPES[extname(rawPath).toLowerCase()];
  if (!contentType) return undefined;

  try {
    const resolvedRoot = await realpath(getUploadRoot(root));
    const resolvedFile = await realpath(resolve(resolvedRoot, rawPath));
    if (!isWithin(resolvedRoot, resolvedFile) || !(await stat(resolvedFile)).isFile()) return undefined;
    return { path: resolvedFile, contentType };
  } catch {
    return undefined;
  }
}

export async function serveMedia(root: string, rawPath: string, method = 'GET') {
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const file = await resolveMediaFile(root, rawPath);
  if (!file) return new Response('Not Found', { status: 404 });

  const headers = new Headers({
    'Content-Type': file.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  if (method === 'HEAD') return new Response(null, { headers });

  return new Response(Readable.toWeb(createReadStream(file.path)) as ReadableStream, { headers });
}

import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import sharp from 'sharp';

import { assetDirectory, assetMediaUrl, assertAssetId, getUploadRoot } from './paths';
import { chooseAutomaticLayout, type ProcessedUpload, type StorageScope } from './types';

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const FILE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
} as const;

type WriteStage = 'original' | 'thumbnail' | 'webp' | 'avif' | 'rename';

export class MediaUploadError extends Error {
  constructor(message: string, readonly status: 400 | 413 | 415 = 400) {
    super(message);
    this.name = 'MediaUploadError';
  }
}

export type ProcessUploadOptions = {
  root?: string;
  id?: () => string;
  now?: () => Date;
  onWrite?: (stage: WriteStage, filename?: string) => void | Promise<void>;
};

function validateFile(file: File) {
  const mimeType = file.type.toLowerCase();
  const extension = FILE_TYPES[mimeType as keyof typeof FILE_TYPES];
  if (!extension) {
    throw new MediaUploadError('仅支持 JPEG、PNG、WebP、AVIF 或 GIF 图片。', 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new MediaUploadError('图片大小不能超过 30 MiB。', 413);
  }
  if (file.size < 1) {
    throw new MediaUploadError('图片文件不能为空。');
  }
  return extension;
}

function derivativeWidths(sourceWidth: number) {
  return [...new Set([960, 1600, 2400].map((width) => Math.min(width, sourceWidth)))];
}

export async function processUpload(file: File, scope: StorageScope, options: ProcessUploadOptions = {}): Promise<ProcessedUpload> {
  if (!file || typeof file.arrayBuffer !== 'function') throw new MediaUploadError('未找到图片文件。');

  const extension = validateFile(file);
  const root = getUploadRoot(options.root);
  const assetId = assertAssetId((options.id ?? randomUUID)());
  const now = options.now ?? (() => new Date());
  const finalDirectory = assetDirectory(root, scope, assetId);
  const temporaryRoot = join(root, `.upload-${assetId}-${now().getTime()}`);
  const temporaryDirectory = join(temporaryRoot, 'asset');
  let committed = false;

  try {
    await mkdir(temporaryDirectory, { recursive: true });
    const originalBytes = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(originalBytes, { animated: false }).rotate().metadata();
    if (!metadata.width || !metadata.height) throw new MediaUploadError('无法读取图片尺寸。');

    const originalFilename = `original.${extension}`;
    await writeFile(join(temporaryDirectory, originalFilename), originalBytes);
    await options.onWrite?.('original', originalFilename);

    const thumbnailWidth = Math.min(480, metadata.width);
    const thumbnailFilename = 'thumbnail-480.webp';
    await sharp(originalBytes, { animated: false })
      .rotate()
      .resize({ width: thumbnailWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(temporaryDirectory, thumbnailFilename));
    await options.onWrite?.('thumbnail', thumbnailFilename);

    const variants = { webp: [], avif: [] } as ProcessedUpload['variants'];
    for (const width of derivativeWidths(metadata.width)) {
      const webpFilename = `image-${width}.webp`;
      await sharp(originalBytes, { animated: false })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(join(temporaryDirectory, webpFilename));
      await options.onWrite?.('webp', webpFilename);
      variants.webp.push({ width, url: assetMediaUrl(scope, assetId, webpFilename) });

      const avifFilename = `image-${width}.avif`;
      await sharp(originalBytes, { animated: false })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .avif({ quality: 58 })
        .toFile(join(temporaryDirectory, avifFilename));
      await options.onWrite?.('avif', avifFilename);
      variants.avif.push({ width, url: assetMediaUrl(scope, assetId, avifFilename) });
    }

    await mkdir(dirname(finalDirectory), { recursive: true });
    await options.onWrite?.('rename');
    await rename(temporaryDirectory, finalDirectory);
    committed = true;

    return {
      originalUrl: assetMediaUrl(scope, assetId, originalFilename),
      thumbnailUrl: assetMediaUrl(scope, assetId, thumbnailFilename),
      width: metadata.width,
      height: metadata.height,
      variants,
      automaticLayout: chooseAutomaticLayout(metadata.width, metadata.height),
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
    if (!committed) await rm(finalDirectory, { recursive: true, force: true });
  }
}

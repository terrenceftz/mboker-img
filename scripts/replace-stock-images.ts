import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import sharp from 'sharp';

type Orientation = 'landscape' | 'portrait' | 'square';
type CategorySlug = 'sunset' | 'nature' | 'city' | 'moment' | 'altay';

type OpenverseAsset = {
  id: string;
  title: string | null;
  creator: string | null;
  license: string;
  license_url: string | null;
  foreign_landing_url: string | null;
  source: string;
  url: string;
  thumbnail: string;
  width: number | null;
  height: number | null;
};

type SourceAsset = OpenverseAsset & {
  localPath: string;
  actualWidth: number;
  actualHeight: number;
};

type Attribution = {
  target: string;
  openverseId: string;
  title: string;
  creator: string;
  license: 'CC0' | 'Public Domain Mark';
  licenseUrl: string;
  sourcePage: string;
  originalUrl: string;
};

type DockerPhotoRow = {
  id: number;
  source_type: string;
  original_url: string;
  category_slug: string;
};

const CATEGORY_SEARCHES: Record<CategorySlug, string> = {
  sunset: 'sunset landscape golden hour',
  nature: 'forest river nature landscape',
  city: 'city architecture urban street photography',
  moment: 'street photography',
  altay: 'alpine mountain lake landscape',
};

const CATEGORY_SLUGS = Object.keys(CATEGORY_SEARCHES) as CategorySlug[];
const LICENSE_URLS = {
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  pdm: 'https://creativecommons.org/publicdomain/mark/1.0/',
} as const;

export function isAllowedLicense(license: string) {
  return license.toLowerCase() === 'cc0' || license.toLowerCase() === 'pdm';
}

export function orientationOf(width: number, height: number): Orientation {
  const ratio = width / height;
  if (ratio > 1.05) return 'landscape';
  if (ratio < 0.95) return 'portrait';
  return 'square';
}

export function shouldPreserveMediaPath(mediaPath: string) {
  return mediaPath.replaceAll('\\', '/').includes('/media/site/home-side/');
}

export function searchQueryForCategory(slug: CategorySlug) {
  return CATEGORY_SEARCHES[slug];
}

export function isSupportedSourceUrl(url: string) {
  const pathname = new URL(url).pathname.toLowerCase();
  return !/\.(?:tif|tiff|svg|pdf)$/.test(pathname);
}

export function configureSharpForReplacement(sharpApi: { cache: (enabled: boolean) => unknown } = sharp) {
  sharpApi.cache(false);
}

function parseArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runProgram(command: string, args: string[], cwd?: string) {
  return new Promise<Buffer>((resolvePromise, reject) => {
    execFile(command, args, { cwd, encoding: 'buffer', maxBuffer: 30 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${stderr.toString().trim() || error.message}`));
        return;
      }
      resolvePromise(stdout);
    });
  });
}

async function fetchBytes(url: string, proxy: string) {
  return runProgram('curl.exe', [
    '--silent',
    '--show-error',
    '--fail',
    '--location',
    '--retry',
    '1',
    '--retry-delay',
    '1',
    '--connect-timeout',
    '10',
    '--max-time',
    '30',
    '--max-filesize',
    '30000000',
    '--user-agent',
    'Mboker-Img/1.0 image-attribution-import',
    '--proxy',
    proxy,
    url,
  ]);
}

export function buildDockerPhotoQueryScript() {
  return [
    'const Database=require("better-sqlite3");',
    'const db=new Database("/app/data/tink.sqlite",{readonly:true,fileMustExist:true});',
    'const rows=db.prepare("SELECT p.id, p.source_type, p.original_url, c.slug AS category_slug FROM photos p JOIN albums a ON a.id = p.album_id JOIN categories c ON c.id = a.category_id ORDER BY c.slug, a.sort_order, p.sort_order, p.id").all();',
    'db.close();',
    'console.log(JSON.stringify(rows));',
  ].join('');
}

export function buildOpenverseSearchUrl(query: string, page: number) {
  const params = new URLSearchParams({
    q: query,
    license: 'cc0,pdm',
    page_size: '20',
    page: String(page),
    mature: 'false',
  });
  return `https://api.openverse.org/v1/images/?${params}`;
}

async function fetchCandidates(query: string, proxy: string) {
  const candidates: OpenverseAsset[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const bytes = await fetchBytes(buildOpenverseSearchUrl(query, page), proxy);
    const body = JSON.parse(bytes.toString('utf8')) as { results?: OpenverseAsset[] };
    candidates.push(...(body.results ?? []).filter((asset) => isAllowedLicense(asset.license) && Boolean(asset.url) && isSupportedSourceUrl(asset.url)));
    if ((body.results?.length ?? 0) < 20) break;
    await new Promise((done) => setTimeout(done, 700));
  }
  return [...new Map(candidates.map((asset) => [asset.id, asset])).values()];
}

async function downloadSource(asset: OpenverseAsset, cacheRoot: string, proxy: string): Promise<SourceAsset | null> {
  const finalPath = join(cacheRoot, `${asset.id}.source`);
  const temporaryPath = `${finalPath}.part`;
  try {
    if (!existsSync(finalPath)) {
      const bytes = await fetchBytes(asset.url, proxy).catch(async () => fetchBytes(asset.thumbnail, proxy));
      await writeFile(temporaryPath, bytes);
      await rename(temporaryPath, finalPath);
    }
    const metadata = await sharp(await readFile(finalPath), { animated: false }).rotate().metadata();
    if (!metadata.width || !metadata.height || metadata.width < 640 || metadata.height < 480) return null;
    return { ...asset, localPath: finalPath, actualWidth: metadata.width, actualHeight: metadata.height };
  } catch (error) {
    console.warn(`Skipping Openverse asset ${asset.id}: ${error instanceof Error ? error.message : String(error)}`);
    await rm(temporaryPath, { force: true });
    await rm(finalPath, { force: true });
    return null;
  }
}

async function findSource(
  targetOrientation: Orientation,
  candidates: OpenverseAsset[],
  usedIds: Set<string>,
  cacheRoot: string,
  proxy: string,
) {
  const ordered = [
    ...candidates.filter((asset) => asset.width && asset.height && orientationOf(asset.width, asset.height) === targetOrientation),
    ...candidates.filter((asset) => !asset.width || !asset.height || orientationOf(asset.width, asset.height) !== targetOrientation),
  ];
  for (const candidate of ordered) {
    if (usedIds.has(candidate.id)) continue;
    usedIds.add(candidate.id);
    const source = await downloadSource(candidate, cacheRoot, proxy);
    if (!source) continue;
    return source;
  }
  throw new Error(`No usable ${targetOrientation} public-domain source remained.`);
}

async function imageFiles(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp|avif|gif)$/i.test(entry.name))
    .map((entry) => join(directory, entry.name))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

async function existingDimensions(path: string) {
  const metadata = await sharp(await readFile(path), { animated: false }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Cannot read image dimensions: ${path}`);
  return { width: metadata.width, height: metadata.height };
}

type CommitRenderedFileOperations = {
  renameFile: (source: string, target: string) => Promise<void>;
  writeFileOver: (source: string, target: string) => Promise<void>;
  removeFile: (path: string) => Promise<void>;
};

export function buildPowerShellOverwriteCommand(source: string, target: string) {
  const literal = (path: string) => `'${path.replaceAll("'", "''")}'`;
  const command = `[System.IO.File]::WriteAllBytes(${literal(target)}, [System.IO.File]::ReadAllBytes(${literal(source)}))`;
  return Buffer.from(command, 'utf16le').toString('base64');
}

export async function commitRenderedFile(
  temporaryPath: string,
  targetPath: string,
  operations: CommitRenderedFileOperations = {
    renameFile: rename,
    writeFileOver: async (source, target) => {
      await runProgram('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-EncodedCommand',
        buildPowerShellOverwriteCommand(source, target),
      ]);
    },
    removeFile: (path) => rm(path, { force: true }),
  },
) {
  try {
    await operations.renameFile(temporaryPath, targetPath);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (!['EPERM', 'EEXIST', 'EBUSY'].includes(code)) throw error;
    await operations.writeFileOver(temporaryPath, targetPath);
    await operations.removeFile(temporaryPath);
  }
}

export async function withStoppedDockerService<T>(
  service: string,
  control: (action: `stop:${string}` | `start:${string}`) => Promise<void>,
  work: () => Promise<T>,
) {
  await control(`stop:${service}`);
  try {
    return await work();
  } finally {
    await control(`start:${service}`);
  }
}

function cappedDimensions(width: number, height: number, longestEdge = 1800) {
  const scale = Math.min(1, longestEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function renderImage(
  sourcePath: string,
  targetPath: string,
  maxEdge?: number,
  requestedDimensions?: { width: number; height: number },
) {
  const original = requestedDimensions ?? await existingDimensions(targetPath);
  const dimensions = cappedDimensions(original.width, original.height, maxEdge ?? 1800);
  const extension = extname(targetPath).toLowerCase();
  const temporaryPath = `${targetPath}.stock-part`;
  let pipeline = sharp(sourcePath, { animated: false })
    .rotate()
    .resize({ ...dimensions, fit: 'cover', position: 'attention', withoutEnlargement: false });

  if (extension === '.jpg' || extension === '.jpeg') pipeline = pipeline.jpeg({ quality: 78, progressive: true, mozjpeg: true });
  else if (extension === '.webp') pipeline = pipeline.webp({ quality: 78, effort: 5 });
  else if (extension === '.avif') pipeline = pipeline.avif({ quality: 48, effort: 5 });
  else if (extension === '.png') pipeline = pipeline.png({ compressionLevel: 9, palette: true });
  else if (extension === '.gif') pipeline = pipeline.grayscale().gif({ colours: 64, effort: 7 });
  else throw new Error(`Unsupported target extension: ${targetPath}`);

  await rm(temporaryPath, { force: true });
  await pipeline.toFile(temporaryPath);
  await commitRenderedFile(temporaryPath, targetPath);
}

function attributionFor(target: string, source: SourceAsset): Attribution {
  const license = source.license.toLowerCase() as 'cc0' | 'pdm';
  return {
    target: target.replaceAll('\\', '/'),
    openverseId: source.id,
    title: source.title?.trim() || 'Untitled',
    creator: source.creator?.trim() || 'Unknown creator',
    license: license === 'cc0' ? 'CC0' : 'Public Domain Mark',
    licenseUrl: source.license_url || LICENSE_URLS[license],
    sourcePage: source.foreign_landing_url || `https://openverse.org/image/${source.id}`,
    originalUrl: source.url,
  };
}

export function cleanAttributionCell(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().replaceAll('|', '\\|');
}

function categoryFromHomeFilename(filename: string): CategorySlug {
  const match = CATEGORY_SLUGS.find((slug) => filename.toLowerCase().includes(slug));
  return match ?? 'moment';
}

async function replaceStaticImages(projectRoot: string, cacheRoot: string, proxy: string) {
  const attributions: Attribution[] = [];
  const sourcePools = new Map<CategorySlug, SourceAsset[]>();
  const sourceCandidates = new Map<CategorySlug, OpenverseAsset[]>();

  for (const slug of CATEGORY_SLUGS) {
    console.log(`Searching Openverse: ${slug}`);
    sourceCandidates.set(slug, await fetchCandidates(searchQueryForCategory(slug), proxy));
  }

  for (const slug of CATEGORY_SLUGS) {
    const targets = await imageFiles(join(projectRoot, 'src', 'assets', 'images', slug));
    const candidates = sourceCandidates.get(slug) ?? [];
    const usedIds = new Set<string>();
    const pool: SourceAsset[] = [];
    for (const target of targets) {
      const dimensions = await existingDimensions(target);
      const source = await findSource(orientationOf(dimensions.width, dimensions.height), candidates, usedIds, cacheRoot, proxy);
      await renderImage(source.localPath, target);
      pool.push(source);
      attributions.push(attributionFor(relative(projectRoot, target), source));
      console.log(`Replaced ${relative(projectRoot, target)}`);
    }
    if (pool.length === 0) throw new Error(`No static gallery targets found for ${slug}.`);
    sourcePools.set(slug, pool);
  }

  for (const slug of CATEGORY_SLUGS) {
    console.log(`Replacing ${slug} covers`);
    const pool = sourcePools.get(slug)!;
    const targetPaths = [
      join(projectRoot, 'src', 'assets', 'category', `${slug}.jpg`),
      join(projectRoot, 'public', 'menu', slug === 'moment' ? 'other.jpg' : `${slug}.jpg`),
    ].filter(existsSync);
    for (const [index, target] of targetPaths.entries()) {
      const source = pool[index % pool.length];
      await renderImage(source.localPath, target, 1200);
      attributions.push(attributionFor(relative(projectRoot, target), source));
    }
  }

  const homeTargets = await imageFiles(join(projectRoot, 'src', 'assets', 'images', 'home'));
  console.log('Replacing homepage gallery images');
  for (const [index, target] of homeTargets.entries()) {
    const slug = categoryFromHomeFilename(basename(target));
    const pool = sourcePools.get(slug)!;
    const source = pool[index % pool.length];
    await renderImage(source.localPath, target, 1600);
    attributions.push(attributionFor(relative(projectRoot, target), source));
  }

  const heroTargets: Array<[string, CategorySlug, number]> = [
    ['public/hero01.jpg', 'altay', 0],
    ['public/og.jpg', 'nature', 1],
    ['public/screenshot.jpg', 'city', 2],
  ];
  console.log('Replacing public hero and social images');
  for (const [targetName, slug, sourceIndex] of heroTargets) {
    const target = join(projectRoot, ...targetName.split('/'));
    const pool = sourcePools.get(slug)!;
    const source = pool[sourceIndex % pool.length];
    await renderImage(source.localPath, target, targetName.includes('og.') ? 1200 : 1800);
    attributions.push(attributionFor(targetName, source));
  }

  console.log('Searching Openverse: portrait');
  const portraitCandidates = await fetchCandidates('photographer self portrait camera', proxy);
  const portraitSource = await findSource('portrait', portraitCandidates, new Set(), cacheRoot, proxy);
  const portraitTargets: Array<[string, { width: number; height: number } | undefined]> = [
    ['src/assets/images/about.jpg', undefined],
    ['src/assets/images/tink.jpg', undefined],
    ['public/hero02.jpg', undefined],
    ['public/hero-preloader.jpg', { width: 128, height: 168 }],
  ];
  for (const [targetName, dimensions] of portraitTargets) {
    console.log(`Replacing ${targetName}`);
    const target = join(projectRoot, ...targetName.split('/'));
    await renderImage(portraitSource.localPath, target, targetName.includes('preloader') ? 320 : 1400, dimensions);
    attributions.push(attributionFor(targetName, portraitSource));
  }

  return { attributions, sourcePools };
}

function mediaPathToDisk(dataRoot: string, mediaUrl: string) {
  const normalized = mediaUrl.replaceAll('\\', '/');
  if (!normalized.startsWith('/media/')) throw new Error(`Not a local media URL: ${mediaUrl}`);
  const uploadsRoot = resolve(dataRoot, 'uploads');
  const diskPath = resolve(uploadsRoot, normalized.slice('/media/'.length));
  const nested = relative(uploadsRoot, diskPath);
  if (nested.startsWith('..') || nested === '') throw new Error(`Unsafe media URL: ${mediaUrl}`);
  return diskPath;
}

async function replaceDockerAlbumMedia(
  projectRoot: string,
  dataRoot: string,
  dockerService: string,
  sourcePools: Map<CategorySlug, SourceAsset[]>,
  attributions: Attribution[],
) {
  console.log(`Reading Docker photo records from ${dockerService}`);
  const bytes = await runProgram(
    'docker',
    ['compose', 'exec', '-T', dockerService, 'node', '-e', buildDockerPhotoQueryScript()],
    projectRoot,
  );
  const rows = JSON.parse(bytes.toString('utf8')) as DockerPhotoRow[];
  console.log(`Docker photo records: ${rows.length}`);

  await withStoppedDockerService(
    dockerService,
    async (action) => {
      const [command, service] = action.split(':');
      console.log(`${command === 'stop' ? 'Stopping' : 'Starting'} Docker service ${service}`);
      await runProgram('docker', ['compose', command, service], projectRoot);
    },
    async () => {
      const categoryIndexes = new Map<CategorySlug, number>();
      for (const row of rows) {
        if (row.source_type !== 'upload') {
          console.warn(`Skipping external photo ${row.id}; it is not stored in Docker media.`);
          continue;
        }
        if (shouldPreserveMediaPath(row.original_url)) continue;
        if (!CATEGORY_SLUGS.includes(row.category_slug as CategorySlug)) {
          console.warn(`Skipping photo ${row.id} in unknown category ${row.category_slug}.`);
          continue;
        }
        const slug = row.category_slug as CategorySlug;
        const pool = sourcePools.get(slug)!;
        const index = categoryIndexes.get(slug) ?? 0;
        const source = pool[index % pool.length];
        categoryIndexes.set(slug, index + 1);

        const originalPath = mediaPathToDisk(dataRoot, row.original_url);
        const directory = dirname(originalPath);
        const files = await imageFiles(directory);
        for (const file of files) await renderImage(source.localPath, file, 2400);
        attributions.push(attributionFor(row.original_url, source));
        console.log(`Replaced Docker photo ${row.id} (${slug})`);
      }
    },
  );
}

async function writeAttributions(projectRoot: string, entries: Attribution[]) {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.target, entry])).values()]
    .sort((a, b) => a.target.localeCompare(b.target, 'en'));
  await writeFile(join(projectRoot, 'docs', 'image-sources.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: uniqueEntries }, null, 2)}\n`);

  const uniqueSources = [...new Map(uniqueEntries.map((entry) => [entry.openverseId, entry])).values()];
  const markdown = [
    '# Image Sources',
    '',
    'All replacement photography in the repository is sourced through Openverse and is limited to CC0 or Public Domain Mark records. The machine-readable per-file mapping is in `docs/image-sources.json`.',
    '',
    'The user-provided `public/mboker.png` signature and the custom Docker `home-side` PNG are intentionally excluded from this replacement set.',
    '',
    `Unique public-domain sources: ${uniqueSources.length}. Mapped repository/runtime targets: ${uniqueEntries.length}.`,
    '',
    '| Title | Creator | License | Source |',
    '| --- | --- | --- | --- |',
    ...uniqueSources.map((source) => `| ${cleanAttributionCell(source.title)} | ${cleanAttributionCell(source.creator)} | [${source.license}](${source.licenseUrl}) | [Openverse/source](${source.sourcePage}) |`),
    '',
  ].join('\n');
  await writeFile(join(projectRoot, 'docs', 'IMAGE_SOURCES.md'), markdown);
}

async function run() {
  configureSharpForReplacement();
  const projectRoot = resolve(parseArg('--project-root') ?? process.cwd());
  const dataRootArg = parseArg('--data-root');
  const dockerService = parseArg('--docker-service') ?? 'mboker-img';
  const cacheRoot = resolve(parseArg('--cache-root') ?? 'D:/Docker/tink-photography/stock-cache');
  const proxy = parseArg('--proxy') ?? process.env.STOCK_IMAGE_PROXY ?? 'http://127.0.0.1:7897';
  await mkdir(cacheRoot, { recursive: true });
  await stat(join(projectRoot, 'package.json'));

  const { attributions, sourcePools } = await replaceStaticImages(projectRoot, cacheRoot, proxy);
  if (dataRootArg) await replaceDockerAlbumMedia(projectRoot, resolve(dataRootArg), dockerService, sourcePools, attributions);
  await writeAttributions(projectRoot, attributions);
  console.log(`Image replacement complete. Attribution entries: ${attributions.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await run();
}

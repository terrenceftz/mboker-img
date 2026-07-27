import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ZipArchive } from 'archiver';
import Database from 'better-sqlite3';

export interface BackupOptions {
  databasePath: string;
  uploadRoot: string;
  backupRoot: string;
  now?: Date;
}

export interface BackupManifest {
  schemaVersion: 1;
  createdAt: string;
  databaseBytes: number;
  uploadFileCount: number;
}

async function countFiles(directory: string): Promise<number> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) count += await countFiles(join(directory, entry.name));
    if (entry.isFile()) count += 1;
  }
  return count;
}

function sqliteLiteral(path: string) {
  return path.replaceAll("'", "''");
}

function ensureInside(root: string, path: string) {
  const nested = relative(root, path);
  if (nested.startsWith('..') || resolve(root, nested) !== path) throw new Error('Backup path escapes BACKUP_ROOT.');
}

export async function createBackup(options: BackupOptions) {
  const databasePath = resolve(options.databasePath);
  const uploadRoot = resolve(options.uploadRoot);
  const backupRoot = resolve(options.backupRoot);
  const createdAt = (options.now ?? new Date()).toISOString();
  const stamp = createdAt.replace(/[:.]/g, '-');
  const archivePath = resolve(backupRoot, `tink-${stamp}.zip`);
  const databaseCopy = resolve(backupRoot, `.tink-${stamp}.sqlite`);
  ensureInside(backupRoot, archivePath);
  ensureInside(backupRoot, databaseCopy);
  await mkdir(backupRoot, { recursive: true });
  await mkdir(uploadRoot, { recursive: true });

  try {
    const source = new Database(databasePath, { readonly: true, fileMustExist: true });
    try {
      source.exec(`VACUUM INTO '${sqliteLiteral(databaseCopy)}'`);
    } finally {
      source.close();
    }

    const manifest: BackupManifest = {
      schemaVersion: 1,
      createdAt,
      databaseBytes: (await stat(databaseCopy)).size,
      uploadFileCount: await countFiles(uploadRoot),
    };

    await new Promise<void>((resolveArchive, rejectArchive) => {
      const output = createWriteStream(archivePath);
      const archive = new ZipArchive({ store: true });
      output.on('close', resolveArchive);
      output.on('error', rejectArchive);
      archive.on('error', rejectArchive);
      archive.pipe(output);
      archive.file(databaseCopy, { name: 'tink.sqlite' });
      archive.directory(uploadRoot, 'uploads');
      archive.append(JSON.stringify(manifest), { name: 'manifest.json' });
      void archive.finalize();
    });

    return { archivePath, manifest };
  } finally {
    await rm(databaseCopy, { force: true });
  }
}

async function runCli() {
  const result = await createBackup({
    databasePath: process.env.DATABASE_PATH ?? 'data/tink.sqlite',
    uploadRoot: process.env.UPLOAD_ROOT ?? 'data/uploads',
    backupRoot: process.env.BACKUP_ROOT ?? 'backups',
  });
  console.log(`Backup created: ${result.archivePath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCli();
}

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

import { createBackup } from '../../scripts/backup';

describe('CMS backup', () => {
  const cleanups: string[] = [];
  afterEach(async () => Promise.all(cleanups.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

  it('archives a consistent database, uploads, and manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'tink-backup-'));
    cleanups.push(root);
    const databasePath = join(root, 'data', 'tink.sqlite');
    const uploadRoot = join(root, 'data', 'uploads');
    const backupRoot = join(root, 'backups');
    await mkdir(uploadRoot, { recursive: true });
    const sqlite = new Database(databasePath);
    sqlite.exec('create table example (id integer primary key, value text); insert into example(value) values (\'saved\')');
    sqlite.close();
    await writeFile(join(uploadRoot, 'photo.webp'), 'image-data');

    const result = await createBackup({
      databasePath, uploadRoot, backupRoot, now: new Date('2026-07-27T01:02:03.000Z'),
    });
    const archiveText = (await readFile(result.archivePath)).toString('latin1');

    expect(archiveText).toContain('tink.sqlite');
    expect(archiveText).toContain('uploads/photo.webp');
    expect(archiveText).toContain('manifest.json');
    expect(archiveText).toContain('"schemaVersion":1');
    expect(result.manifest.uploadFileCount).toBe(1);
    expect(result.manifest.databaseBytes).toBeGreaterThan(0);
  });
});

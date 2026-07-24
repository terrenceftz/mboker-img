import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { createTestDatabase } from '../helpers/database';
import { createDatabase } from '../../src/server/db/client';
import { albums, categories, photos, sessions } from '../../src/server/db/schema';

const databases: Array<Awaited<ReturnType<typeof createTestDatabase>>> = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function openTestDatabase() {
  const database = await createTestDatabase();
  databases.push(database);
  return database;
}

describe('SQLite database', () => {
  it('loads better-sqlite3 and can execute a query', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tink-cms-native-'));
    const filename = join(directory, 'smoke.sqlite');
    const sqlite = new Database(filename);

    try {
      expect(sqlite.prepare('select 1 as value').get()).toEqual({ value: 1 });
    } finally {
      sqlite.close();
      await rm(directory, { force: true, recursive: true, maxRetries: 3 });
    }
  });

  it('supports an in-memory connection for isolated callers', () => {
    const connection = createDatabase(':memory:');

    try {
      expect(connection.sqlite.prepare('select 1 as value').get()).toEqual({ value: 1 });
    } finally {
      connection.close();
    }
  });

  it('rejects a duplicate category slug', async () => {
    const database = await openTestDatabase();
    await database.seedCategory({ slug: 'travel' });

    expect(() =>
      database.db.insert(categories).values({ title: 'Duplicate', slug: 'travel' }).run(),
    ).toThrow(/unique constraint failed/i);
  });

  it('keeps a seeded album owned by its category', async () => {
    const database = await openTestDatabase();
    const category = await database.seedCategory();
    const album = await database.seedAlbum(category.id);

    expect(album.categoryId).toBe(category.id);
    expect(database.db.select().from(albums).where(eq(albums.id, album.id)).get()?.categoryId).toBe(
      category.id,
    );
  });

  it('rejects duplicate album slugs and albums without a category', async () => {
    const database = await openTestDatabase();
    const category = await database.seedCategory();
    await database.seedAlbum(category.id, { slug: 'northern-lights' });

    expect(() =>
      database.db
        .insert(albums)
        .values({ categoryId: category.id, title: 'Duplicate', slug: 'northern-lights' })
        .run(),
    ).toThrow(/unique constraint failed/i);
    expect(() =>
      database.db.insert(albums).values({ categoryId: 999_999, title: 'Orphan', slug: 'orphan' }).run(),
    ).toThrow(/foreign key constraint failed/i);
  });

  it('restricts category deletion and cascades album photo deletion', async () => {
    const database = await openTestDatabase();
    const category = await database.seedCategory();
    const album = await database.seedAlbum(category.id);
    const photo = database.db
      .insert(photos)
      .values({ albumId: album.id, originalUrl: '/images/original.jpg' })
      .returning()
      .get();

    expect(() => database.db.delete(categories).where(eq(categories.id, category.id)).run()).toThrow(
      /foreign key constraint failed/i,
    );
    database.db.delete(albums).where(eq(albums.id, album.id)).run();
    expect(database.db.select().from(photos).where(eq(photos.id, photo.id)).get()).toBeUndefined();
  });

  it('stores wide photo variants and assigns session ids', async () => {
    const database = await openTestDatabase();
    const category = await database.seedCategory();
    const album = await database.seedAlbum(category.id);
    const variants = {
      webp: [{ width: 1280, url: '/images/photo-1280.webp' }],
      avif: [{ width: 1280, url: '/images/photo-1280.avif' }],
    };
    const photo = database.db
      .insert(photos)
      .values({
        albumId: album.id,
        originalUrl: '/images/photo.jpg',
        layoutPreset: 'wide',
        variantsJson: variants,
      })
      .returning()
      .get();
    const session = database.db
      .insert(sessions)
      .values({ tokenHash: 'session-token', expiresAt: new Date('2030-01-01T00:00:00.000Z') })
      .returning()
      .get();

    expect(photo.layoutPreset).toBe('wide');
    expect(photo.variantsJson).toEqual(variants);
    expect(session.id).toEqual(expect.any(Number));
  });

  it('configures SQLite durability and concurrency pragmas', async () => {
    const database = await openTestDatabase();

    expect(database.sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.sqlite.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(database.sqlite.pragma('busy_timeout', { simple: true })).toBe(5000);
    expect(database.sqlite.pragma('synchronous', { simple: true })).toBe(1);
  });
});

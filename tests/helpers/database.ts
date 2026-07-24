import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { createDatabase } from '../../src/server/db/client';
import { runMigrations } from '../../src/server/db/migrate';
import { albums, categories } from '../../src/server/db/schema';

type CategoryValues = Partial<typeof categories.$inferInsert>;
type AlbumValues = Partial<typeof albums.$inferInsert>;

export async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), 'tink-cms-db-'));
  const filename = join(directory, 'test.sqlite');

  runMigrations(filename);
  const connection = createDatabase(filename);
  const db = drizzle(connection.sqlite);

  return {
    db,
    sqlite: connection.sqlite,
    async seedCategory(values: CategoryValues = {}) {
      return db
        .insert(categories)
        .values({
          title: 'Test category',
          slug: `category-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ...values,
        })
        .returning()
        .get();
    },
    async seedAlbum(categoryId: number, values: AlbumValues = {}) {
      return db
        .insert(albums)
        .values({
          categoryId,
          title: 'Test album',
          slug: `album-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ...values,
        })
        .returning()
        .get();
    },
    async close() {
      connection.close();
      await rm(directory, { force: true, recursive: true, maxRetries: 3 });
    },
  };
}

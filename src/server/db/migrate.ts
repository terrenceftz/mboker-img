import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createDatabase, resolveDatabasePath } from './client';

export function runMigrations(filename = resolveDatabasePath()) {
  const connection = createDatabase(filename);

  try {
    migrate(connection.db, { migrationsFolder: resolve('drizzle') });
  } finally {
    connection.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runMigrations();
}

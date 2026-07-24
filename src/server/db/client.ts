import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

export type DatabaseConnection = ReturnType<typeof openConnection>;

function openConnection(filename: string) {
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const sqlite = new Database(filename);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

export function resolveDatabasePath() {
  return resolve(process.env.DATABASE_PATH ?? 'data/tink.sqlite');
}

export function createDatabase(filename: string) {
  return openConnection(filename === ':memory:' ? filename : resolve(filename));
}

let projectConnection: DatabaseConnection | undefined;

export function getDatabase() {
  projectConnection ??= openConnection(resolveDatabasePath());
  return projectConnection.db;
}

export function getDatabaseConnection() {
  projectConnection ??= openConnection(resolveDatabasePath());
  return projectConnection;
}

export function closeDatabase() {
  projectConnection?.close();
  projectConnection = undefined;
}

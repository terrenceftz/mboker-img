import { createHash, randomBytes } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import { sessions } from '../db/schema';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

type Database = BetterSQLite3Database<any>;

export type Clock = { now?: () => Date };

export function sessionTokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function currentTime(clock: Clock) {
  return clock.now?.() ?? new Date();
}

export function createSession(db: Database, clock: Clock = {}) {
  const createdAt = currentTime(clock);
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_MS);
  const session = db
    .insert(sessions)
    .values({ tokenHash: sessionTokenHash(token), createdAt, expiresAt })
    .returning()
    .get();

  return { id: session.id, token, expiresAt };
}

export function readSession(db: Database, token: string, clock: Clock = {}) {
  const now = currentTime(clock);
  const tokenHash = sessionTokenHash(token);
  const session = db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).get();

  if (!session) return undefined;
  if (session.expiresAt.getTime() <= now.getTime()) {
    db.delete(sessions).where(eq(sessions.id, session.id)).run();
    return undefined;
  }

  // Keep the table bounded even if a client never presents an expired cookie.
  db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
  return session;
}

export function destroySession(db: Database, token: string) {
  return db.delete(sessions).where(eq(sessions.tokenHash, sessionTokenHash(token))).run();
}

export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

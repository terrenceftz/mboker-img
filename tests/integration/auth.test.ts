import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { hashPassword, verifyAdminCredentials } from '../../src/server/auth/password';
import {
  createSession,
  destroySession,
  readSession,
  sessionTokenHash,
} from '../../src/server/auth/session';
import {
  buildSessionCookie,
  isAllowedOrigin,
  normalizeAdminNextPath,
} from '../../src/server/auth/guard';
import { LoginRateLimiter } from '../../src/server/auth/rate-limit';
import { sessions } from '../../src/server/db/schema';
import { createTestDatabase } from '../helpers/database';

const databases: Array<Awaited<ReturnType<typeof createTestDatabase>>> = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function openTestDatabase() {
  const database = await createTestDatabase();
  databases.push(database);
  return database;
}

describe('administrator credentials', () => {
  it('hashes with Argon2id without retaining the plaintext', async () => {
    const password = 'correct horse battery staple';
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(password);
  });

  it('accepts only the configured username and password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    const config = { username: 'owner', passwordHash: hash };

    await expect(verifyAdminCredentials('owner', 'correct horse battery staple', config)).resolves.toBe(true);
    await expect(verifyAdminCredentials('owner', 'wrong password', config)).resolves.toBe(false);
    await expect(verifyAdminCredentials('unknown', 'correct horse battery staple', config)).resolves.toBe(false);
  });
});

describe('administrator sessions', () => {
  it('stores only a SHA-256 token hash and reads a live session', async () => {
    const database = await openTestDatabase();
    const now = new Date('2026-07-24T00:00:00.000Z');
    const session = createSession(database.db, { now: () => now });
    const stored = database.db.select().from(sessions).where(eq(sessions.id, session.id)).get();

    expect(session.token).toHaveLength(64);
    expect(stored?.tokenHash).toBe(sessionTokenHash(session.token));
    expect(stored?.tokenHash).not.toContain(session.token);
    expect(readSession(database.db, session.token, { now: () => now })?.id).toBe(session.id);
  });

  it('denies and deletes a session exactly twelve hours after creation', async () => {
    const database = await openTestDatabase();
    const createdAt = new Date('2026-07-24T00:00:00.000Z');
    const session = createSession(database.db, { now: () => createdAt });
    const expiry = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);

    expect(readSession(database.db, session.token, { now: () => new Date(expiry.getTime() - 1) })?.id).toBe(session.id);
    expect(readSession(database.db, session.token, { now: () => expiry })).toBeUndefined();
    expect(database.db.select().from(sessions).where(eq(sessions.id, session.id)).get()).toBeUndefined();
  });

  it('destroys an existing session before a replacement session is used', async () => {
    const database = await openTestDatabase();
    const first = createSession(database.db);

    destroySession(database.db, first.token);
    const second = createSession(database.db);

    expect(readSession(database.db, first.token)).toBeUndefined();
    expect(readSession(database.db, second.token)?.id).toBe(second.id);
  });
});

describe('login request protections', () => {
  it('uses a strict, production-aware session cookie', () => {
    expect(buildSessionCookie('token', true)).toEqual({
      name: 'tink_admin_session',
      value: 'token',
      options: { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 43_200, secure: true },
    });
    expect(buildSessionCookie('token', false).options.secure).toBe(false);
  });

  it('normalizes only local admin next paths', () => {
    expect(normalizeAdminNextPath('/admin/albums?status=draft')).toBe('/admin/albums?status=draft');
    expect(normalizeAdminNextPath('/admin/login')).toBe('/admin');
    expect(normalizeAdminNextPath('/admin/login?next=/admin/albums')).toBe('/admin');
    expect(normalizeAdminNextPath('https://attacker.test/admin')).toBe('/admin');
    expect(normalizeAdminNextPath('//attacker.test')).toBe('/admin');
    expect(normalizeAdminNextPath('/collection/city')).toBe('/admin');
  });

  it('accepts same-origin and configured site origins only', () => {
    expect(isAllowedOrigin('https://photos.example.com', 'https://photos.example.com/admin', 'https://public.example.com')).toBe(true);
    expect(isAllowedOrigin('https://photos.example.com', 'https://photos.example.com/admin', 'not a URL')).toBe(true);
    expect(isAllowedOrigin('https://public.example.com', 'https://photos.example.com/admin', 'https://public.example.com')).toBe(true);
    expect(isAllowedOrigin('https://attacker.test', 'https://photos.example.com/admin', 'https://public.example.com')).toBe(false);
  });

  it('blocks after five failures and resets after success', () => {
    let now = new Date('2026-07-24T00:00:00.000Z').getTime();
    const limiter = new LoginRateLimiter({ now: () => now });

    for (let attempt = 0; attempt < 5; attempt += 1) limiter.recordFailure('127.0.0.1');
    expect(limiter.isLimited('127.0.0.1')).toBe(true);
    expect(limiter.retryAfterSeconds('127.0.0.1')).toBe(900);
    limiter.reset('127.0.0.1');
    expect(limiter.isLimited('127.0.0.1')).toBe(false);
    now += 15 * 60 * 1000;
    expect(limiter.isLimited('127.0.0.1')).toBe(false);
  });
});

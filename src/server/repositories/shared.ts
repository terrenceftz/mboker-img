import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export type CmsDatabase = BetterSQLite3Database<any>;

export type RepositoryErrorCode =
  | 'NOT_FOUND'
  | 'SLUG_CONFLICT'
  | 'CATEGORY_NOT_EMPTY'
  | 'INVALID_ORDER'
  | 'PHOTO_NOT_IN_ALBUM';

export class RepositoryError extends Error {
  constructor(readonly code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export function notFound(resource: string): never {
  throw new RepositoryError('NOT_FOUND', `${resource} was not found.`);
}

export function withSlugConflict<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof Error && /unique constraint failed: .*\.slug/i.test(error.message)) {
      throw new RepositoryError('SLUG_CONFLICT', 'That slug is already in use.');
    }
    throw error;
  }
}

export function assertCompleteOrder(actualIds: number[], requestedIds: number[]) {
  const unique = new Set(requestedIds);
  if (
    unique.size !== requestedIds.length ||
    actualIds.length !== requestedIds.length ||
    actualIds.some((id) => !unique.has(id))
  ) {
    throw new RepositoryError('INVALID_ORDER', 'Order must contain every item ID exactly once.');
  }
}

export function now() {
  return new Date();
}

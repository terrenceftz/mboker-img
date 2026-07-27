import { describe, expect, it } from 'vitest';

import { repositoryError } from '../../src/server/http/admin-api';
import { RepositoryError } from '../../src/server/repositories/shared';

describe('admin repository errors', () => {
  it('maps cross-album photo references to a conflict response', async () => {
    const response = repositoryError(new RepositoryError(
      'PHOTO_NOT_IN_ALBUM',
      'Special layouts can only use photos from their album.',
    ));

    expect(response?.status).toBe(409);
    await expect(response?.json()).resolves.toMatchObject({
      error: { code: 'PHOTO_NOT_IN_ALBUM' },
    });
  });
});

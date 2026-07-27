import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { posts } from '../../src/server/db/schema';
import { renderMarkdownSafe } from '../../src/server/markdown/render';
import { getPublishedPostBySlug, listPostsAdmin, listPostsPublished } from '../../src/server/repositories/posts';
import { RepositoryError } from '../../src/server/repositories/shared';
import { createTestDatabase } from '../helpers/database';

describe('published posts', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('orders published posts and never exposes drafts', () => {
    testDatabase.db.insert(posts).values([
      { title: 'Older', slug: 'older', status: 'published', publishedAt: new Date('2026-01-01') },
      { title: 'Newest', slug: 'newest', status: 'published', publishedAt: new Date('2026-02-01') },
      { title: 'Draft', slug: 'draft', status: 'draft' },
    ]).run();

    expect(listPostsPublished(testDatabase.db).map((post) => post.slug)).toEqual(['newest', 'older']);
    expect(() => getPublishedPostBySlug(testDatabase.db, 'draft')).toThrowError(RepositoryError);
  });

  it('keeps scheduled posts private until their publication time', () => {
    testDatabase.db.insert(posts).values([
      { title: 'Available', slug: 'available', status: 'published', publishedAt: new Date('2020-01-01') },
      { title: 'Scheduled', slug: 'scheduled', status: 'published', publishedAt: new Date('2099-01-01') },
    ]).run();

    expect(listPostsPublished(testDatabase.db).map((post) => post.slug)).toEqual(['available']);
    expect(() => getPublishedPostBySlug(testDatabase.db, 'scheduled')).toThrowError(RepositoryError);
  });

  it('filters admin posts by exact editorial status', () => {
    testDatabase.db.insert(posts).values([
      { title: 'Draft', slug: 'draft-only', status: 'draft' },
      { title: 'Published', slug: 'published-only', status: 'published', publishedAt: new Date('2026-01-01') },
    ]).run();

    expect(listPostsAdmin(testDatabase.db, 'draft').map((post) => post.slug)).toEqual(['draft-only']);
    expect(listPostsAdmin(testDatabase.db, 'published').map((post) => post.slug)).toEqual(['published-only']);
  });
});

describe('safe Markdown rendering', () => {
  it('keeps editorial markup and removes scripts and unsafe URLs', async () => {
    const html = await renderMarkdownSafe(`
# Heading

[Safe](https://example.com) [Unsafe](javascript:alert(1))

![Photo](https://images.example.com/photo.jpg)

<script>alert('xss')</script>
`);

    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('https://example.com');
    expect(html).toContain('noopener noreferrer');
    expect(html).toContain('https://images.example.com/photo.jpg');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
  });
});

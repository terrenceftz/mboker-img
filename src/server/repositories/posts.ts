import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { posts } from '../db/schema';
import { type CmsDatabase, notFound, now, withSlugConflict } from './shared';

type NewPost = typeof posts.$inferInsert;
type PostChanges = Partial<Omit<NewPost, 'id' | 'createdAt' | 'updatedAt'>>;

export function listPostsAdmin(db: CmsDatabase) {
  return db.select().from(posts).orderBy(desc(posts.publishedAt), desc(posts.id)).all();
}

export function listPostsPublished(db: CmsDatabase) {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.status, 'published'), isNotNull(posts.publishedAt)))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .all();
}

export function getPostById(db: CmsDatabase, id: number) {
  return db.select().from(posts).where(eq(posts.id, id)).get() ?? notFound('Post');
}

export function getPostBySlug(db: CmsDatabase, slug: string) {
  return db.select().from(posts).where(eq(posts.slug, slug)).get() ?? notFound('Post');
}

export function getPublishedPostBySlug(db: CmsDatabase, slug: string) {
  const post = getPostBySlug(db, slug);
  if (post.status !== 'published' || !post.publishedAt) return notFound('Post');
  return post;
}

export function createPost(db: CmsDatabase, values: NewPost) {
  return withSlugConflict(() => db.insert(posts).values(values).returning().get());
}

export function updatePost(db: CmsDatabase, id: number, values: PostChanges) {
  return withSlugConflict(() => {
    const post = db
      .update(posts)
      .set({ ...values, updatedAt: now() })
      .where(eq(posts.id, id))
      .returning()
      .get();
    return post ?? notFound('Post');
  });
}

export function deletePost(db: CmsDatabase, id: number) {
  const post = db.delete(posts).where(eq(posts.id, id)).returning().get();
  return post ?? notFound('Post');
}

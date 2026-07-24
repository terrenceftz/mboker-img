import { asc, eq } from 'drizzle-orm';

import { albums, categories } from '../db/schema';
import {
  assertCompleteOrder,
  type CmsDatabase,
  notFound,
  now,
  RepositoryError,
  withSlugConflict,
} from './shared';

type NewCategory = typeof categories.$inferInsert;
type CategoryChanges = Partial<Omit<NewCategory, 'id' | 'createdAt' | 'updatedAt'>>;

export function listCategoriesAdmin(db: CmsDatabase) {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)).all();
}

export function listCategoriesPublished(db: CmsDatabase) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.status, 'published'))
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all();
}

export function getCategoryById(db: CmsDatabase, id: number) {
  return db.select().from(categories).where(eq(categories.id, id)).get() ?? notFound('Category');
}

export function getCategoryBySlug(db: CmsDatabase, slug: string) {
  return db.select().from(categories).where(eq(categories.slug, slug)).get() ?? notFound('Category');
}

export function getPublishedCategoryBySlug(db: CmsDatabase, slug: string) {
  const category = db.select().from(categories).where(eq(categories.slug, slug)).get();
  if (!category || category.status !== 'published') return notFound('Category');
  return category;
}

export function createCategory(db: CmsDatabase, values: NewCategory) {
  return withSlugConflict(() => db.insert(categories).values(values).returning().get());
}

export function updateCategory(db: CmsDatabase, id: number, values: CategoryChanges) {
  return withSlugConflict(() => {
    const category = db
      .update(categories)
      .set({ ...values, updatedAt: now() })
      .where(eq(categories.id, id))
      .returning()
      .get();
    return category ?? notFound('Category');
  });
}

export function reorderCategories(db: CmsDatabase, ids: number[]) {
  return db.transaction((tx: CmsDatabase) => {
    const actualIds = tx.select({ id: categories.id }).from(categories).all().map((row) => row.id);
    assertCompleteOrder(actualIds, ids);
    const updatedAt = now();
    ids.forEach((id, sortOrder) => {
      tx.update(categories).set({ sortOrder, updatedAt }).where(eq(categories.id, id)).run();
    });
    return listCategoriesAdmin(tx);
  });
}

export function deleteCategory(db: CmsDatabase, id: number) {
  const existing = db.select({ id: albums.id }).from(albums).where(eq(albums.categoryId, id)).get();
  if (existing) throw new RepositoryError('CATEGORY_NOT_EMPTY', 'Category still contains albums.');
  const deleted = db.delete(categories).where(eq(categories.id, id)).returning().get();
  return deleted ?? notFound('Category');
}

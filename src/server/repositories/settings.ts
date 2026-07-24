import { eq } from 'drizzle-orm';

import { siteSettings } from '../db/schema';
import { type CmsDatabase, now } from './shared';

export type SiteSettingsInput = Partial<
  Omit<typeof siteSettings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
>;

export function getSettings(db: CmsDatabase) {
  return db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get() ?? null;
}

export function upsertSettings(db: CmsDatabase, values: SiteSettingsInput) {
  const timestamp = now();
  db.insert(siteSettings)
    .values({ id: 1, ...values, createdAt: timestamp, updatedAt: timestamp })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...values, updatedAt: timestamp } })
    .run();
  return getSettings(db)!;
}

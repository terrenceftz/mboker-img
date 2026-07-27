import { eq } from 'drizzle-orm';

import { siteSettings } from '../db/schema';
import { type CmsDatabase, now } from './shared';

export type SiteSettingsInput = Partial<
  Omit<typeof siteSettings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
>;

export function getSettings(db: CmsDatabase) {
  const settings = db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
  if (!settings) return null;
  return {
    ...settings,
    siteName: settings.siteName === 'Tink Photo Gallery' ? 'Mboker Img' : settings.siteName,
    shortName: settings.shortName === 'Tink.' ? 'Mboker Img' : settings.shortName,
    defaultSeoTitle: settings.defaultSeoTitle === 'Tink Photo Gallery' ? 'Mboker Img' : settings.defaultSeoTitle,
    homeIntro: settings.homeIntro.replaceAll('Tink', 'Mboker Img'),
    defaultSeoDescription: settings.defaultSeoDescription.replaceAll('Tink', 'Mboker Img'),
  };
}

export function upsertSettings(db: CmsDatabase, values: SiteSettingsInput) {
  const timestamp = now();
  db.insert(siteSettings)
    .values({ id: 1, ...values, createdAt: timestamp, updatedAt: timestamp })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...values, updatedAt: timestamp } })
    .run();
  return getSettings(db)!;
}

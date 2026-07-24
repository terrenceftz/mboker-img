import { asc, eq } from 'drizzle-orm';

import { aboutPages, aboutProfileItems, socialLinks } from '../db/schema';
import { type CmsDatabase, now } from './shared';

type AboutValues = Omit<typeof aboutPages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
type ProfileValues = Omit<typeof aboutProfileItems.$inferInsert, 'id' | 'sortOrder'>;
type SocialValues = Omit<typeof socialLinks.$inferInsert, 'id' | 'sortOrder'>;

export type AboutInput = Partial<AboutValues> & {
  profileItems: ProfileValues[];
  socialLinks: SocialValues[];
};

export function getAbout(db: CmsDatabase) {
  const page = db.select().from(aboutPages).where(eq(aboutPages.id, 1)).get() ?? null;
  const profileItems = db
    .select()
    .from(aboutProfileItems)
    .orderBy(asc(aboutProfileItems.sortOrder), asc(aboutProfileItems.id))
    .all();
  const links = db
    .select()
    .from(socialLinks)
    .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id))
    .all();
  return { page, profileItems, socialLinks: links };
}

export function upsertAbout(db: CmsDatabase, input: AboutInput) {
  return db.transaction((tx: CmsDatabase) => {
    const { profileItems, socialLinks: links, ...page } = input;
    const timestamp = now();
    tx.insert(aboutPages)
      .values({ id: 1, ...page, createdAt: timestamp, updatedAt: timestamp })
      .onConflictDoUpdate({ target: aboutPages.id, set: { ...page, updatedAt: timestamp } })
      .run();
    tx.delete(aboutProfileItems).run();
    tx.delete(socialLinks).run();
    if (profileItems.length) {
      tx.insert(aboutProfileItems)
        .values(profileItems.map((item, sortOrder) => ({ ...item, sortOrder })))
        .run();
    }
    if (links.length) {
      tx.insert(socialLinks)
        .values(links.map((link, sortOrder) => ({ ...link, sortOrder })))
        .run();
    }
    return getAbout(tx);
  });
}

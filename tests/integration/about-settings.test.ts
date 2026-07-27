import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getAbout, upsertAbout } from '../../src/server/repositories/about';
import { getSettings, upsertSettings } from '../../src/server/repositories/settings';
import { aboutInput } from '../../src/server/validation/about';
import { settingsInput } from '../../src/server/validation/settings';
import { createTestDatabase } from '../helpers/database';

describe('About and site settings', () => {
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('updates existing About content and preserves item ordering', () => {
    const first = aboutInput.parse({
      name: 'Tink', role: '摄影师', intro: '旧介绍', biography: '', email: 'hello@example.com',
      portraitSource: 'external', portraitUrl: 'https://images.example.com/portrait.jpg',
      seoTitle: '', seoDescription: '',
      profileItems: [{ label: '城市', value: '杭州', href: '', external: false }],
      socialLinks: [{ label: 'GitHub', handle: '@tink', href: 'https://github.com/tink' }],
    });
    upsertAbout(testDatabase.db, first);
    upsertAbout(testDatabase.db, { ...first, intro: '新介绍', profileItems: [
      { label: '器材', value: '相机', href: '', external: false },
      { label: '城市', value: '上海', href: '', external: false },
    ] });

    const saved = getAbout(testDatabase.db);
    expect(saved.page?.intro).toBe('新介绍');
    expect(saved.profileItems.map((item) => item.label)).toEqual(['器材', '城市']);
    expect(saved.socialLinks).toHaveLength(1);
  });

  it('rejects unknown analytics keys before replacing saved settings', () => {
    const valid = settingsInput.parse({
      siteName: 'Tink Photo Gallery', shortName: 'Tink.', siteUrl: 'https://photos.example.com',
      locale: 'zh-CN', homeTitle: '影像故事', homeIntro: '记录日常',
      defaultSeoTitle: 'Tink', defaultSeoDescription: '摄影作品', analyticsJson: { google: 'G-TEST123' },
    });
    upsertSettings(testDatabase.db, valid);

    expect(settingsInput.safeParse({ ...valid, analyticsJson: { custom: '<script>' } }).success).toBe(false);
    expect(getSettings(testDatabase.db)?.analyticsJson).toEqual({ google: 'G-TEST123' });
  });

  it('displays Mboker Img for untouched legacy Tink site settings', () => {
    upsertSettings(testDatabase.db, settingsInput.parse({
      siteName: 'Tink Photo Gallery', shortName: 'Tink.', siteUrl: 'https://photos.example.com',
      locale: 'zh-CN', homeTitle: '影像故事', homeIntro: '欢迎来到 Tink 的摄影学习日记',
      defaultSeoTitle: 'Tink Photo Gallery', defaultSeoDescription: '欢迎来到 Tink 的摄影学习日记', analyticsJson: {},
    }));

    expect(getSettings(testDatabase.db)).toMatchObject({
      siteName: 'Mboker Img',
      shortName: 'Mboker Img',
      defaultSeoTitle: 'Mboker Img',
      homeIntro: '欢迎来到 Mboker Img 的摄影学习日记',
    });
  });
});

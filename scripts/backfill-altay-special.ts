import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { eq } from 'drizzle-orm';

import { createDatabase, resolveDatabasePath } from '../src/server/db/client';
import { runMigrations } from '../src/server/db/migrate';
import { albums, type SpecialLayoutDocument } from '../src/server/db/schema';
import { updateAlbum } from '../src/server/repositories/albums';
import { listPhotos } from '../src/server/repositories/photos';
import type { CmsDatabase } from '../src/server/repositories/shared';

export const ALTAY_MARKDOWN = `**行程**  阿勒泰

**Name**  Altay

**地理位置**  阿勒泰地区西部

**记录时间**  2023.11

**印象**  冰天雪地、静谧、孤寂

**体验推荐**  禾木、喀纳斯、可可托海

**路线参考**  乌鲁木齐 → 布尔津 → 喀纳斯 → 禾木 → 克拉玛依 → 博乐 → 霍城 → 新源 → 巴音郭楞 → 独库公路`;

export function createAltaySpecialLayout(
  albumPhotos: Array<{ id: number }>,
): SpecialLayoutDocument {
  const [first, ...remaining] = albumPhotos;
  if (!first) return { version: 1, blocks: [] };
  return {
    version: 1,
    blocks: [
      {
        id: 'altay-intro',
        type: 'split',
        direction: 'image-text',
        ratio: '3:2',
        verticalAlign: 'start',
        photoId: first.id,
        markdown: ALTAY_MARKDOWN,
      },
      ...remaining.map((photo) => ({
        id: `altay-photo-${photo.id}`,
        type: 'image' as const,
        photoId: photo.id,
      })),
    ],
  };
}

export function backfillAltaySpecial(db: CmsDatabase) {
  const row = db.select().from(albums).where(eq(albums.slug, 'altay')).get();
  if (!row || row.specialLayoutJson.blocks.length > 0) return false;
  const layout = createAltaySpecialLayout(listPhotos(db, row.id));
  if (layout.blocks.length === 0) return false;
  updateAlbum(db, row.id, { isSpecial: true, specialLayoutJson: layout });
  return true;
}

function runCli() {
  const databasePath = resolveDatabasePath();
  runMigrations(databasePath);
  const connection = createDatabase(databasePath);
  try {
    console.log(JSON.stringify({ changed: backfillAltaySpecial(connection.db) }));
  } finally {
    connection.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli();
}

import { describe, expect, it } from 'vitest';

import {
  buildOpenverseSearchUrl,
  buildDockerPhotoQueryScript,
  commitRenderedFile,
  buildPowerShellOverwriteCommand,
  cleanAttributionCell,
  configureSharpForReplacement,
  isAllowedLicense,
  isSupportedSourceUrl,
  orientationOf,
  searchQueryForCategory,
  shouldPreserveMediaPath,
  withStoppedDockerService,
} from '../../scripts/replace-stock-images';

describe('stock image replacement safeguards', () => {
  it('only accepts CC0 and public-domain-mark assets', () => {
    expect(isAllowedLicense('cc0')).toBe(true);
    expect(isAllowedLicense('pdm')).toBe(true);
    expect(isAllowedLicense('by')).toBe(false);
    expect(isAllowedLicense('by-sa')).toBe(false);
  });

  it('classifies square, portrait, and landscape targets', () => {
    expect(orientationOf(1600, 1000)).toBe('landscape');
    expect(orientationOf(900, 1200)).toBe('portrait');
    expect(orientationOf(1000, 1000)).toBe('square');
  });

  it('preserves the user-provided home-side media tree', () => {
    expect(shouldPreserveMediaPath('/media/site/home-side/id/original.png')).toBe(true);
    expect(shouldPreserveMediaPath('/media/albums/1/id/original.jpg')).toBe(false);
  });

  it('stays within the unauthenticated Openverse page-size limit', () => {
    const url = new URL(buildOpenverseSearchUrl('mountain', 2));
    expect(url.searchParams.get('page_size')).toBe('20');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('uses a broad enough search for the moment gallery', () => {
    expect(searchQueryForCategory('moment')).toBe('street photography');
  });

  it('rejects oversized source formats before download', () => {
    expect(isSupportedSourceUrl('https://upload.wikimedia.org/photo.tif')).toBe(false);
    expect(isSupportedSourceUrl('https://upload.wikimedia.org/photo.tiff?download=1')).toBe(false);
    expect(isSupportedSourceUrl('https://live.staticflickr.com/photo.jpg')).toBe(true);
  });

  it('queries photo records inside the Node 22 Docker container', () => {
    const script = buildDockerPhotoQueryScript();
    expect(script).toContain('/app/data/tink.sqlite');
    expect(script).toContain('JOIN categories');
    expect(script).toContain('JSON.stringify(rows)');
  });

  it('falls back to byte overwrite when Windows refuses an overwrite rename', async () => {
    const calls: string[] = [];
    const error = Object.assign(new Error('locked destination'), { code: 'EPERM' });
    await commitRenderedFile('source.part', 'target.webp', {
      renameFile: async () => { throw error; },
      writeFileOver: async () => { calls.push('write'); },
      removeFile: async () => { calls.push('remove'); },
    });
    expect(calls).toEqual(['write', 'remove']);
  });

  it('always restarts Docker after album media work', async () => {
    const calls: string[] = [];
    await expect(withStoppedDockerService(
      'mboker-img',
      async (action) => { calls.push(action); },
      async () => { throw new Error('write failed'); },
    )).rejects.toThrow('write failed');
    expect(calls).toEqual(['stop:mboker-img', 'start:mboker-img']);
  });

  it('encodes Windows overwrite paths inside the PowerShell command', () => {
    const encoded = buildPowerShellOverwriteCommand("D:\\cache\\source's.part", 'D:\\media\\target.webp');
    const decoded = Buffer.from(encoded, 'base64').toString('utf16le');
    expect(decoded).toContain("ReadAllBytes('D:\\cache\\source''s.part')");
    expect(decoded).toContain("WriteAllBytes('D:\\media\\target.webp'");
  });

  it('disables Sharp caching before replacing mapped Docker files', () => {
    const values: boolean[] = [];
    configureSharpForReplacement({ cache: (enabled) => { values.push(enabled); } });
    expect(values).toEqual([false]);
  });

  it('removes source HTML from Markdown attribution cells', () => {
    expect(cleanAttributionCell("<div class='fn'> Sunset</div> | view")).toBe('Sunset \\| view');
  });
});

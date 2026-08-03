import { describe, expect, it } from 'vitest';

import { resolvePublicSiteConfig } from '../../src/config/public-site';

describe('public site proxy security config', () => {
  it('creates an exact trusted proxy domain from PUBLIC_SITE_URL', () => {
    expect(resolvePublicSiteConfig('https://photos.example.com/')).toEqual({
      site: 'https://photos.example.com',
      allowedDomain: {
        protocol: 'https',
        hostname: 'photos.example.com',
      },
    });
  });

  it('retains an explicit non-default port', () => {
    expect(resolvePublicSiteConfig('https://preview.example.com:8443').allowedDomain).toEqual({
      protocol: 'https',
      hostname: 'preview.example.com',
      port: '8443',
    });
  });

  it('rejects non-http site URLs', () => {
    expect(() => resolvePublicSiteConfig('file:///tmp/photos')).toThrow('PUBLIC_SITE_URL');
  });
});

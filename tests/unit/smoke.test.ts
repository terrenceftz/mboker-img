import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/config/site';
import { ssrConfig } from '../../src/config/ssr';

describe('upstream import', () => {
  it('keeps the Tink visitor identity', () => {
    expect(siteConfig.shortName).toBe('Tink.');
    expect(siteConfig.locale).toBe('zh-CN');
  });

  it('uses standalone server rendering', () => {
    expect(ssrConfig.output).toBe('server');
  });
});

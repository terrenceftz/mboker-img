import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/config/site';
import { ssrConfig } from '../../src/config/ssr';

describe('upstream import', () => {
  it('uses the Mboker Img visitor identity', () => {
    expect(siteConfig.shortName).toBe('Mboker Img');
    expect(siteConfig.name).toContain('Mboker Img');
    expect(siteConfig.locale).toBe('zh-CN');
  });

  it('uses standalone server rendering', () => {
    expect(ssrConfig.output).toBe('server');
    expect(ssrConfig.nodeAdapter).toEqual({ mode: 'standalone' });
  });
});

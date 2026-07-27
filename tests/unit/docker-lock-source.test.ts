import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('cross-platform Docker dependency lock', () => {
  it('retains Linux musl native packages when the lockfile is updated on Windows', () => {
    const workspace = readFileSync('pnpm-workspace.yaml', 'utf8');
    const lockfile = readFileSync('pnpm-lock.yaml', 'utf8');

    expect(workspace).toContain('supportedArchitectures:');
    expect(workspace).toContain('linux');
    expect(workspace).toContain('musl');
    expect(lockfile).toContain('lightningcss-linux-x64-musl@1.32.0');
  });
});

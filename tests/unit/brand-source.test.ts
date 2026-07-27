import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('Mboker Img product identity', () => {
  it('brands the admin shell and login screen', () => {
    const shell = readFileSync('src/layouts/AdminLayout.astro', 'utf8');
    const sidebar = readFileSync('src/components/admin/AdminSidebar.astro', 'utf8');
    const login = readFileSync('src/pages/admin/login.astro', 'utf8');

    expect(shell).toContain('Mboker Img');
    expect(sidebar).toContain('Mboker Img');
    expect(login).toContain('Mboker Img');
  });

  it('uses the new package and Docker service names with D-drive persistence defaults', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const compose = readFileSync('docker-compose.yml', 'utf8');

    expect(packageJson.name).toBe('mboker-img');
    expect(compose).toContain('mboker-img:');
    expect(compose).toContain('container_name: mboker-img');
    expect(compose).toContain('D:/Docker/mboker-img/data');
    expect(compose).toContain('D:/Docker/mboker-img/backups');
  });
});

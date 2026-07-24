import type { AstroCookieSetOptions } from 'astro';

export const SESSION_COOKIE_NAME = 'tink_admin_session';

export function buildSessionCookie(value: string, secure: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 43_200,
      secure,
    } satisfies AstroCookieSetOptions,
  };
}

export function normalizeAdminNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/admin') || value.startsWith('//')) {
    return '/admin';
  }

  try {
    const url = new URL(value, 'http://local.invalid');
    if (
      url.origin !== 'http://local.invalid' ||
      url.pathname === '/admin/login' ||
      (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/'))
    ) {
      return '/admin';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/admin';
  }
}

export function isAllowedOrigin(
  origin: string | null,
  requestUrl: string,
  publicSiteUrl = process.env.PUBLIC_SITE_URL,
) {
  if (!origin) return false;

  try {
    const requestOrigin = new URL(requestUrl).origin;
    if (origin === requestOrigin) return true;
  } catch {
    return false;
  }

  try {
    return Boolean(publicSiteUrl && origin === new URL(publicSiteUrl).origin);
  } catch {
    return false;
  }
}

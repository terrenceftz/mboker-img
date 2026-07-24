import { defineMiddleware } from 'astro:middleware';

import { getDatabase } from './server/db/client';
import { isAllowedOrigin, SESSION_COOKIE_NAME } from './server/auth/guard';
import { readSession } from './server/auth/session';

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
} as const;

function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isAdminPage(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminApi(pathname: string) {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/');
}

function isStateChanging(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function isBrowserForm(request: Request) {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  return contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const adminPage = isAdminPage(pathname);
  const adminApi = isAdminApi(pathname);

  if (!adminPage && !adminApi) return withSecurityHeaders(await next());

  if (adminApi && isStateChanging(context.request.method)) {
    const origin = context.request.headers.get('origin');
    if ((origin && !isAllowedOrigin(origin, context.request.url)) || (!origin && isBrowserForm(context.request))) {
      return withSecurityHeaders(
        Response.json({ error: '请求来源无效。' }, { status: 403 }),
      );
    }
  }

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? readSession(getDatabase(), token) : undefined;
  const loginPage = pathname === '/admin/login';
  const loginApi = pathname === '/api/admin/login';

  if (!session && !loginPage && !loginApi) {
    if (adminApi) {
      return withSecurityHeaders(Response.json({ error: '需要登录。' }, { status: 401 }));
    }

    const nextPath = `${pathname}${context.url.search}`;
    return withSecurityHeaders(context.redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`, 303));
  }

  if (session && loginPage) {
    return withSecurityHeaders(context.redirect('/admin', 303));
  }

  return withSecurityHeaders(await next());
});

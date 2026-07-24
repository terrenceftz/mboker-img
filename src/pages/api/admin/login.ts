import type { APIRoute } from 'astro';

import { buildSessionCookie, normalizeAdminNextPath, SESSION_COOKIE_NAME } from '../../../server/auth/guard';
import { verifyAdminCredentials } from '../../../server/auth/password';
import { loginRateLimiter } from '../../../server/auth/rate-limit';
import { createSession, destroySession } from '../../../server/auth/session';
import { getDatabase } from '../../../server/db/client';
import { loginSchema } from '../../../server/validation/auth';

const GENERIC_LOGIN_ERROR = '用户名或密码不正确，请重试。';

function loginFailureRedirect(next: string) {
  const query = new URLSearchParams({ error: 'invalid', next });
  return new Response(null, { status: 303, headers: { Location: `/admin/login?${query}` } });
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const ip = clientAddress || 'unknown';
  const formData = await request.formData().catch(() => undefined);
  const parsed = loginSchema.safeParse({
    username: formData?.get('username'),
    password: formData?.get('password'),
    next: formData?.get('next') || undefined,
  });
  const nextPath = normalizeAdminNextPath(parsed.success ? parsed.data.next : undefined);

  if (loginRateLimiter.isLimited(ip)) {
    return Response.json(
      { error: GENERIC_LOGIN_ERROR },
      {
        status: 429,
        headers: { 'Retry-After': String(loginRateLimiter.retryAfterSeconds(ip)) },
      },
    );
  }

  if (!parsed.success) {
    loginRateLimiter.recordFailure(ip);
    return loginFailureRedirect(nextPath);
  }

  const valid = await verifyAdminCredentials(parsed.data.username, parsed.data.password, {
    username: process.env.ADMIN_USERNAME ?? '',
    passwordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
  });

  if (!valid) {
    loginRateLimiter.recordFailure(ip);
    return loginFailureRedirect(nextPath);
  }

  const db = getDatabase();
  const existingToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (existingToken) destroySession(db, existingToken);

  const session = createSession(db);
  const cookie = buildSessionCookie(session.token, process.env.NODE_ENV === 'production');
  cookies.set(cookie.name, cookie.value, cookie.options);
  loginRateLimiter.reset(ip);

  return new Response(null, { status: 303, headers: { Location: nextPath } });
};

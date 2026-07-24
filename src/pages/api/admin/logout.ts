import type { APIRoute } from 'astro';

import { SESSION_COOKIE_NAME } from '../../../server/auth/guard';
import { destroySession } from '../../../server/auth/session';
import { getDatabase } from '../../../server/db/client';

export const POST: APIRoute = ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) destroySession(getDatabase(), token);
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

  return new Response(null, { status: 303, headers: { Location: '/admin/login' } });
};

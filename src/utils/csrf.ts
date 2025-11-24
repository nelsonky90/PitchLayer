import { cookies, headers } from 'next/headers';
import { randomBytes } from 'crypto';

export function ensureCsrfToken() {
  const cookieStore = cookies();
  let token = cookieStore.get('csrf-token')?.value;
  if (!token) {
    token = randomBytes(32).toString('hex');
    cookieStore.set('csrf-token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
  }
  return token;
}

export function verifyCsrf() {
  const cookieToken = cookies().get('csrf-token')?.value;
  const headerToken = headers().get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new Error('Invalid CSRF token');
  }
}

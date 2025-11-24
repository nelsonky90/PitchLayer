import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const csrfCookie = req.cookies.get('csrf-token');
  if (!csrfCookie) {
    const token = randomBytes(32).toString('hex');
    res.cookies.set('csrf-token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
  }
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';");
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

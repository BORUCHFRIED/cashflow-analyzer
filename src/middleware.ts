import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login page and auth API through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;
  const secret = process.env.AUTH_SECRET;

  if (!secret || !token || token !== secret) {
    // API routes return JSON 401 — not an HTML redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

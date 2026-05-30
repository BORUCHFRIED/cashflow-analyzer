import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (
      username === process.env.APP_USERNAME &&
      password === process.env.APP_PASSWORD
    ) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set('auth-token', process.env.AUTH_SECRET!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

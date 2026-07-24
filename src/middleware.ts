import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin and /admin/* except /admin/login
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  // Protect /api/admin/* and POST/DELETE to /api/social, /api/judges, /api/teams, /api/report
  const isProtectedApiMethod = request.method !== 'GET';
  const isProtectedApiRoute = pathname.startsWith('/api/social') || pathname.startsWith('/api/judges') || pathname.startsWith('/api/teams') || pathname.startsWith('/api/report');
  
  const isAdminApiRoute = pathname.startsWith('/api/admin') || (isProtectedApiRoute && isProtectedApiMethod);

  if (isAdminRoute || isAdminApiRoute) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = process.env.ADMIN_PASSWORD || '';
      await jwtVerify(token, new TextEncoder().encode(secret));
    } catch (err) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If token is invalid, clear it and redirect
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('admin_token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

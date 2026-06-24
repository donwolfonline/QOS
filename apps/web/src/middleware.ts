import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

// A lightweight, in-memory rate-limit store scopes to the Vercel Edge Isolate.
// Keys are IP addresses, values are request counts.
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. GUEST MICRO-UI ROUTE (/m/*)
  // Ensure it remains 100% public, bypasses auth, and has rate-limiting headers.
  if (pathname.startsWith('/m/')) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    
    // Clean up expired entries to prevent memory leaks in the isolate
    if (Math.random() < 0.1) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (value.expiresAt < now) {
          rateLimitMap.delete(key);
        }
      }
    }

    const currentRecord = rateLimitMap.get(ip);
    let count = 1;
    let expiresAt = now + RATE_LIMIT_WINDOW_MS;

    if (currentRecord && currentRecord.expiresAt > now) {
      count = currentRecord.count + 1;
      expiresAt = currentRecord.expiresAt;
    }

    rateLimitMap.set(ip, { count, expiresAt });

    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - count);
    const response = NextResponse.next();
    
    // Inject Rate-Limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.floor(expiresAt / 1000).toString());

    if (count > RATE_LIMIT_MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: response.headers,
      });
    }

    return response;
  }

  // 2. ADMIN COMMAND CENTER (/admin/*)
  if (pathname.startsWith('/admin')) {
    // Exclude the login page itself to prevent redirect loops
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get('QOS_ADMIN_SESSION');
    let isValid = false;

    if (sessionCookie?.value) {
      // Cryptographically verify the HMAC SHA-256 token
      const payload = await verifyAdminToken(sessionCookie.value);
      if (payload && payload.admin === true) {
        isValid = true;
      }
    }

    if (!isValid) {
      // Redirect to the highly secure Cyberpunk login page
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

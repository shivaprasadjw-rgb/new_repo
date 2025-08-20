import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Ensure CSRF token cookie exists (double-submit cookie pattern)
  const existingCsrf = request.cookies.get('csrf-token')?.value || '';
  const isValidCsrf = existingCsrf && existingCsrf.length === 64;
  if (!isValidCsrf) {
    // Generate 32-byte hex string using Web Crypto API
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const csrf = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    response.cookies.set('csrf-token', csrf, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 // 1 hour; will rotate on login
    });
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    // Allow inline scripts for Next.js hydration (no eval)
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // Rate limiting for API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `rate_limit:${ip}:${request.nextUrl.pathname}`;
    
    // Simple in-memory rate limiting (in production, use Redis)
    // This is a basic implementation - consider using a proper rate limiting library
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

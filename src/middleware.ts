import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request.headers);

  // 1. Rate Limiting on Billing API (prevents card testing attacks & order spam)
  if (pathname.startsWith('/api/billing/create-order') || pathname.startsWith('/api/billing/verify-payment')) {
    const rateCheck = checkRateLimit(ip, 'billing-action', 25, 60); // 25 requests / min
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many payment requests from this IP. Please wait ${rateCheck.resetSeconds} seconds before retrying.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetSeconds),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // 1.5 Rate Limiting on Coupon Validation (prevents promo code dictionary brute-forcing)
  if (pathname.startsWith('/api/coupons/validate')) {
    const rateCheck = checkRateLimit(ip, 'coupon-validate', 20, 60); // 20 attempts / min
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many coupon code validation attempts. Please wait ${rateCheck.resetSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetSeconds),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // 2. Rate Limiting on Authentication pages (brute force & credential stuffing protection)
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    const rateCheck = checkRateLimit(ip, 'auth-page', 20, 300); // 20 requests per 5 minutes
    if (!rateCheck.allowed) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Too Many Requests - DocStudio</title></head>
        <body style="font-family: -apple-system, sans-serif; background: #09090b; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 420px; padding: 32px; border: 1px solid #27272a; border-radius: 16px; background: #121212;">
            <h2 style="margin-top: 0; font-size: 20px;">Rate Limit Exceeded</h2>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
              Too many sign-in attempts were detected from your network address. For your security, please wait ${rateCheck.resetSeconds} seconds and refresh this page.
            </p>
            <p style="font-size: 12px; color: #71717a;">IP: ${ip} &bull; DocStudio Security Shield</p>
          </div>
        </body>
        </html>`,
        {
          status: 429,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Retry-After': String(rateCheck.resetSeconds),
          },
        }
      );
    }
  }

  // 3. Attach Defense-in-Depth HTTP Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg, icon.svg, sitemap.xml, robots.txt
     * - public assets like docdril.svg
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|docdril.svg).*)',
  ],
};

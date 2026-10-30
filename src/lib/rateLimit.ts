/**
 * Production-ready in-memory sliding window rate limiter for Next.js.
 * Tracks requests per IP address with automatic memory garbage collection.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (now > record.resetAt) {
        ipStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks whether an incoming request from an IP address is within rate limits.
 *
 * @param ip Client IP address
 * @param bucket Category key (e.g. 'auth-login', 'billing-order', 'public-api')
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowSeconds Time window duration in seconds
 */
export function checkRateLimit(
  ip: string,
  bucket: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const key = `${bucket}:${ip || '127.0.0.1'}`;
  const existing = ipStore.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    ipStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (existing.count >= maxRequests) {
    const remainingTime = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, remainingTime),
    };
  }

  existing.count += 1;
  const remainingTime = Math.ceil((existing.resetAt - now) / 1000);
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    resetSeconds: Math.max(1, remainingTime),
  };
}

/**
 * Extracts the real client IP address from request headers.
 * Supports Cloudflare (cf-connecting-ip), reverse proxies (x-forwarded-for), and local dev.
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0];
    if (firstIp) return firstIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Sliding-window rate limiter, keyed by an identifier (IP + route, or
 * userId + route).
 *
 * Backed by Upstash Redis (REST-based, so it works from serverless/edge
 * functions without a persistent TCP connection) when
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are configured. This
 * makes limits consistent across all server instances/regions.
 *
 * Falls back to an in-memory Map when Redis isn't configured (e.g. local
 * dev) so the app still runs without extra setup — but that fallback is
 * per-instance and resets on restart, so it should not be relied on in a
 * multi-instance production deployment.
 */

import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!redis && process.env.NODE_ENV === 'production') {
  console.warn(
    'Rate limiting is running in-memory (no UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN set). ' +
      'This does not work correctly across multiple serverless instances — set these env vars in production.'
  );
}

// ---- In-memory fallback (used only when Redis isn't configured) ----

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically clear stale buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

function rateLimitInMemory(
  identifier: string,
  { limit = 5, windowMs = 60_000 }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt < now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(identifier, bucket);
    return { success: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// ---- Redis-backed implementation ----

async function rateLimitRedis(
  identifier: string,
  { limit = 5, windowMs = 60_000 }: RateLimitOptions
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  // INCR is atomic; only set the expiry on the first hit in the window so
  // the window doesn't keep sliding forward on every request.
  const count = await redis!.incr(key);

  if (count === 1) {
    await redis!.pexpire(key, windowMs);
  }

  const ttl = await redis!.pttl(key);
  const resetAt = Date.now() + (ttl && ttl > 0 ? ttl : windowMs);

  if (count > limit) {
    return { success: false, remaining: 0, resetAt };
  }

  return { success: true, remaining: Math.max(0, limit - count), resetAt };
}

/**
 * Checks and increments the rate limit bucket for `identifier`. Always
 * async (even the in-memory fallback resolves synchronously) so call sites
 * work the same regardless of which backend is active.
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  if (redis) {
    try {
      return await rateLimitRedis(identifier, options);
    } catch (err) {
      // If Redis is unreachable, fail open to the in-memory limiter rather
      // than blocking every request in the app.
      console.error('Redis rate-limit error, falling back to in-memory:', err);
      return rateLimitInMemory(identifier, options);
    }
  }
  return rateLimitInMemory(identifier, options);
}

/**
 * Extracts a best-effort client identifier from a Next.js Request for rate
 * limiting purposes (proxied deployments set x-forwarded-for).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

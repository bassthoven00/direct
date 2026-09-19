/**
 * src/lib/rateLimiter.ts
 */

import Redis from "ioredis";

// Global Redis instance for Next.js to prevent connection exhaustion in dev mode
const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || "redis://localhost:6379");

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export class RateLimitError extends Error {
  constructor(message = "Too many requests, please try again later.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Basic fixed-window rate limiter.
 * @param key Unique identifier (e.g., 'login:192.168.1.1')
 * @param limit Max requests per window
 * @param windowSeconds Window duration in seconds
 */
export async function applyRateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    if (current > limit) {
      throw new RateLimitError();
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    // If Redis is offline, gracefully allow the request in development
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Redis offline, skipping rate limit for ${key}`);
      return;
    }
    throw error;
  }
}

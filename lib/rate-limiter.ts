import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  uniqueTokenPerInterval?: number;
  interval?: number;
  maxRequests?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private tokenCache: LRUCache<string, number[]>;

  constructor(options: RateLimitConfig = {}) {
    this.tokenCache = new LRUCache({
      max: options.uniqueTokenPerInterval || 500,
      ttl: options.interval || 60000, // 1 minute default
    });
  }

  async check(
    request: NextRequest,
    options: RateLimitConfig = {}
  ): Promise<RateLimitResult> {
    const interval = options.interval || 60000; // 1 minute
    const maxRequests = options.maxRequests || 60; // 60 requests per minute default

    // Get client IP
    const ip = this.getClientIP(request);
    const tokenKey = `rate-limit:${ip}`;

    // Get current timestamp
    const now = Date.now();
    const windowStart = now - interval;

    // Get existing requests for this IP
    const existingRequests = this.tokenCache.get(tokenKey) || [];

    // Filter out old requests (outside the current window)
    const validRequests = existingRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: windowStart + interval,
      };
    }

    // Add current request
    validRequests.push(now);
    this.tokenCache.set(tokenKey, validRequests);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - validRequests.length,
      reset: now + interval,
    };
  }

  private getClientIP(request: NextRequest): string {
    // Try to get IP from various headers (for different deployment scenarios)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback to a default for development
    return '127.0.0.1';
  }
}

// Create rate limiter instances for different endpoints
export const weatherRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 1000,
  interval: 60000, // 1 minute
});

export const airQualityRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 1000,
  interval: 60000, // 1 minute
});

export const cityInfoRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 1000,
  interval: 60000, // 1 minute
});

// More restrictive rate limit for external API calls
export const externalAPIRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
});

// Rate limit middleware function
export async function rateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  options: RateLimitConfig = {}
): Promise<RateLimitResult> {
  return await limiter.check(request, options);
} 
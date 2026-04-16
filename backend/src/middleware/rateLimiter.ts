import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

function createLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV !== 'production') return next();
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetAt < now) {
      store[key] = { count: 1, resetAt: now + windowMs };
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((store[key].resetAt - now) / 1000),
      });
    }

    next();
  };
}

// 100 req/15min for general API
export const apiLimiter = createLimiter(100, 15 * 60 * 1000);

// 10 req/15min for auth endpoints
export const authLimiter = createLimiter(10, 15 * 60 * 1000);

import { Request, Response, NextFunction, RequestHandler } from 'express';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

interface RateRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RequestHandler {
  const store = new Map<string, RateRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();

    // Purge expired entries
    for (const [key, record] of store.entries()) {
      if (now >= record.resetAt) {
        store.delete(key);
      }
    }

    const ip = req.ip ?? 'unknown';
    const record = store.get(ip);

    if (!record) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      res.status(429).json({ error: "You're submitting too quickly. Please wait a minute before trying again." });
      return;
    }

    next();
  };
}

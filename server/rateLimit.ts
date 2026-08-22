import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_FAILED_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCK_MS = 3 * 60 * 1000; // 3 minutes temporary cooldown

export function rateLimitLogin(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const key = `${ip}_${email}`;

  const record = loginAttempts.get(key);
  const now = Date.now();

  if (record) {
    // Check if currently locked
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / (60 * 1000));
      res.status(429).json({
        error: `Too many failed login attempts. Please wait ${remainingMinutes} minute(s) before trying again.`,
        code: 'RATE_LIMITED',
        locked_remaining_minutes: remainingMinutes
      });
      return;
    }

    // Reset if window has passed
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }

  next();
}

export function resetRateLimitForEmail(email: string): void {
  const cleanEmail = email.toLowerCase().trim();
  for (const [key] of loginAttempts.entries()) {
    if (key.endsWith(`_${cleanEmail}`)) {
      loginAttempts.delete(key);
    }
  }
}

export function recordFailedLogin(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const key = `${ip}_${email}`;

  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, {
      count: 1,
      firstAttempt: now,
    });
  } else {
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCK_MS;
    }
    loginAttempts.set(key, record);
  }
}

export function recordSuccessfulLogin(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const key = `${ip}_${email}`;
  loginAttempts.delete(key);
}

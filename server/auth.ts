import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, SubscriptionTier, SubscriptionStatus } from '../src/types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'myfoodscanner-jwt-secret-2026';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

// Middleware: Authenticate any logged-in user or admin
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  // Refresh user state from DB
  const user = await db.getUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier,
    subscription_status: user.subscription_status,
  };

  next();
}

// Middleware: Strict Admin only guard. Always returns 403 Forbidden for non-admins.
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Please log in as admin' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    return;
  }

  next();
}

// Middleware: Strict Subscriber guard (Admin bypasses)
export function requireSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Please log in' });
    return;
  }

  if (req.user.role === 'admin') {
    next();
    return;
  }

  // If tier is not pro or status is neither active nor cancelled, reject
  if (req.user.tier !== 'pro' || (req.user.subscription_status !== 'active' && req.user.subscription_status !== 'cancelled')) {
    res.status(403).json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'An active Pro subscription ($4.99/mo) is required to access this feature.',
    });
    return;
  }

  next();
}

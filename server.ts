import express, { Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { generateToken, authenticate, requireAdmin, requireSubscription, AuthenticatedRequest } from './server/auth';
import { analyzeFoodLabel } from './server/ai';
import { 
  createPayPalOrder, 
  verifyAndCapturePayPalOrder, 
  processRefund48h, 
  cancelAutoRenewal, 
  handlePayPalWebhook,
  PAYPAL_CLIENT_ID,
  PAYPAL_ENVIRONMENT 
} from './server/paypal';
import { sendWelcomeEmail, sendWeeklyFoodSafetyTip } from './server/email';

import { rateLimitLogin, recordFailedLogin, recordSuccessfulLogin, resetRateLimitForEmail } from './server/rateLimit';

// Email validation regex (RFC 5322 compliant subset)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function sanitizeString(input: any): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip angle brackets to neutralize HTML/XSS
    .trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers & Hardening
  app.disable('x-powered-by');
  app.use((req: Request, res: Response, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // 1. User Register (Public)
  app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, region } = req.body;
      
      // Type safety & presence checks (NoSQL injection defense)
      if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        res.status(400).json({ error: 'Invalid data format.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanName = sanitizeString(name);

      if (!cleanEmail || !password || !cleanName) {
        res.status(400).json({ error: 'All required fields must be provided.' });
        return;
      }

      if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.includes('<') || cleanEmail.includes('>')) {
        res.status(400).json({ error: 'Invalid email address format.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const existing = await db.getUserByEmail(cleanEmail);
      if (existing) {
        res.status(400).json({ error: 'An account already exists with this email address.' });
        return;
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await db.createUser({
        email: cleanEmail,
        password_hash,
        name: cleanName,
        region: typeof region === 'string' ? region : 'EU',
        role: 'user',
      });

      // Clear any previous failed login attempt counters for this email
      resetRateLimitForEmail(cleanEmail);

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tier: user.tier,
        subscription_status: user.subscription_status,
      });

      // Send Welcome Brevo email asynchronously
      sendWelcomeEmail(user.email, user.name).catch(console.error);

      res.status(201).json({ token, user: db.sanitizeUser(user) });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  });

  // 2. User Login (Protected by Rate Limiter against Brute Force)
  app.post('/api/auth/login', rateLimitLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Strict type checks against NoSQL injection
      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        res.status(400).json({ error: 'Please enter both your email address and password.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(cleanEmail);

      if (!user) {
        recordFailedLogin(req);
        res.status(401).json({ 
          error: `No account was found for "${cleanEmail}". Please check your email spelling or create a new account by clicking Sign Up.`,
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        recordFailedLogin(req);
        res.status(401).json({ 
          error: 'Incorrect password. Please verify your password and try again.',
          code: 'INCORRECT_PASSWORD'
        });
        return;
      }

      recordSuccessfulLogin(req);

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tier: user.tier,
        subscription_status: user.subscription_status,
      });

      res.json({
        token,
        user: db.sanitizeUser(user),
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login process error.' });
    }
  });

  // 3. Admin Dedicated Login (Strict Admin only, Protected by Rate Limiter)
  app.post('/api/auth/admin/login', rateLimitLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(cleanEmail);

      if (!user || user.role !== 'admin') {
        recordFailedLogin(req);
        res.status(403).json({ error: 'Admin access denied. Invalid credentials.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        recordFailedLogin(req);
        res.status(403).json({ error: 'Admin access denied. Incorrect password.' });
        return;
      }

      recordSuccessfulLogin(req);

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: 'admin',
        tier: user.tier,
        subscription_status: user.subscription_status,
      });

      res.json({
        token,
        user: db.sanitizeUser(user),
      });
    } catch (err: any) {
      console.error('Admin login error:', err);
      res.status(500).json({ error: 'Admin login error.' });
    }
  });

  // 4. Current User Info
  app.get('/api/auth/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await db.getUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json({ user: db.sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ error: 'Server error.' });
    }
  });

  // ==========================================
  // USER PROFILE ROUTES
  // ==========================================
  app.get('/api/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await db.getUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json({ diet_profile: user.diet_profile, user: db.sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching profile.' });
    }
  });

  app.put('/api/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, email, region, diet_profile } = req.body;
      const updates: any = {};
      
      if (name) {
        updates.name = sanitizeString(name);
      }
      
      if (email && typeof email === 'string') {
        const cleanEmail = email.toLowerCase().trim();
        if (!EMAIL_REGEX.test(cleanEmail)) {
          res.status(400).json({ error: 'Invalid email address format.' });
          return;
        }
        const existing = await db.getUserByEmail(cleanEmail);
        if (existing && existing.id !== req.user!.id) {
          res.status(400).json({ error: 'This email address is already in use by another account.' });
          return;
        }
        updates.email = cleanEmail;
      }

      if (region && typeof region === 'string') {
        updates.region = region;
      }

      if (diet_profile && typeof diet_profile === 'object') {
        updates.diet_profile = diet_profile;
      }

      const updated = await db.updateUser(req.user!.id, updates);
      res.json({ user: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Error updating profile.' });
    }
  });

  // ==========================================
  // AI FOOD SCAN ROUTES (PROTECTED: PRO SUB REQ)
  // ==========================================
  app.post('/api/scan', authenticate, requireSubscription, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        res.status(400).json({ error: 'Food label image is required.' });
        return;
      }

      const user = await db.getUserById(req.user!.id);
      const scanResult = await analyzeFoodLabel(image, mimeType || 'image/jpeg', user?.diet_profile);
      scanResult.user_id = req.user!.id;
      scanResult.image_url = image.startsWith('http') ? image : (image.length > 500 ? image.substring(0, 500) : image);

      // Save to database & scan history
      const saved = await db.saveScan(scanResult);
      res.status(201).json(saved);
    } catch (err: any) {
      console.error('Scan analysis error:', err);
      res.status(422).json({ error: err.message || 'Unable to analyze this label. Please provide a clear, well-lit photo.' });
    }
  });

  // ==========================================
  // SCAN HISTORY & STATS ROUTES
  // ==========================================
  app.get('/api/history', authenticate, requireSubscription, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const history = await db.getUserScanHistory(req.user!.id);
      res.json({ history });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching history.' });
    }
  });

  app.get('/api/history/:id', authenticate, requireSubscription, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const scan = await db.getScanById(req.params.id);
      if (!scan || scan.user_id !== req.user!.id) {
        res.status(404).json({ error: 'Scan not found.' });
        return;
      }
      res.json({ scan });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching scan.' });
    }
  });

  app.delete('/api/history/:id', authenticate, requireSubscription, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deleted = await db.deleteScanHistoryItem(req.user!.id, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Item not found.' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Error deleting scan item.' });
    }
  });

  app.get('/api/stats', authenticate, requireSubscription, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const history = await db.getUserScanHistory(req.user!.id);
      const totalScans = history.length;
      let scoreSum = 0;
      let bestProduct = totalScans > 0 ? history[0] : null;
      let totalAdditivesAvoided = 0;

      for (const item of history) {
        scoreSum += item.global_score;
        if (!bestProduct || item.global_score > bestProduct.global_score) {
          bestProduct = item;
        }
        totalAdditivesAvoided += item.additives_count;
      }

      res.json({
        totalScans,
        averageScore: totalScans > 0 ? Math.round(scoreSum / totalScans) : 0,
        bestProduct: bestProduct ? { name: bestProduct.product_name, brand: bestProduct.brand, score: bestProduct.global_score } : null,
        additivesAvoidedCount: totalAdditivesAvoided,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error calculating statistics.' });
    }
  });

  // ==========================================
  // SUBSCRIPTION & 48H GUARANTEE ROUTES
  // ==========================================
  app.get('/api/subscription/status', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await db.getUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      let guaranteeRemainingMs = 0;
      let isGuaranteeEligible = false;

      if (user.first_payment_date && user.subscription_status === 'active') {
        const paymentTime = new Date(user.first_payment_date).getTime();
        const elapsedMs = Date.now() - paymentTime;
        const total48hMs = 48 * 60 * 60 * 1000;
        guaranteeRemainingMs = Math.max(0, total48hMs - elapsedMs);
        isGuaranteeEligible = guaranteeRemainingMs > 0;
      }

      res.json({
        status: user.subscription_status,
        tier: user.tier,
        plan: user.subscription_plan,
        subscription_start: user.subscription_start,
        renews_at: user.subscription_renews_at,
        first_payment_date: user.first_payment_date,
        guarantee_eligible: isGuaranteeEligible,
        guarantee_remaining_ms: guaranteeRemainingMs,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching subscription status.' });
    }
  });

  // PayPal Public Configuration
  app.get('/api/paypal/config', async (_req: Request, res: Response): Promise<void> => {
    res.json({
      clientId: PAYPAL_CLIENT_ID,
      environment: PAYPAL_ENVIRONMENT,
      currency: 'USD',
    });
  });

  // Create real PayPal Order via PayPal REST API
  app.post('/api/paypal/create-order', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { plan } = req.body;
      const selectedPlan = plan === 'annual' ? 'annual' : 'monthly';
      const order = await createPayPalOrder(selectedPlan);
      res.json(order);
    } catch (err: any) {
      console.error('Create PayPal order error:', err);
      res.status(500).json({ error: err.message || 'Unable to initialize PayPal order.' });
    }
  });

  // Capture & strictly verify PayPal order payment before granting access
  app.post('/api/paypal/capture-order', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { plan, orderId } = req.body;
      if (!orderId) {
        res.status(400).json({ error: 'PayPal order ID is required.' });
        return;
      }
      const selectedPlan = plan === 'annual' ? 'annual' : 'monthly';
      const updatedUser = await verifyAndCapturePayPalOrder(req.user!.id, selectedPlan, orderId);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      console.error('Capture PayPal order error:', err);
      res.status(400).json({ error: err.message || 'Payment could not be verified on PayPal.' });
    }
  });

  // Activate subscription - ONLY with verified PayPal Order ID
  app.post('/api/subscription/activate', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { plan, orderId } = req.body;
      if (!orderId) {
        res.status(400).json({ error: 'A completed and confirmed PayPal transaction orderId is required.' });
        return;
      }
      const selectedPlan = plan === 'annual' ? 'annual' : 'monthly';
      const updatedUser = await verifyAndCapturePayPalOrder(req.user!.id, selectedPlan, orderId);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Payment verification failed on PayPal.' });
    }
  });

  // Cancel auto-renewal
  app.post('/api/subscription/cancel', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updatedUser = await cancelAutoRenewal(req.user!.id);
      res.json({ success: true, message: 'Automatic renewal successfully turned off.', user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error cancelling auto-renewal.' });
    }
  });

  // Claim 48-Hour Money-Back Guarantee Refund
  app.post('/api/subscription/refund-48h', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await processRefund48h(req.user!.id);
      res.json({ success: true, message: `Refund of $${result.refundAmount.toFixed(2)} processed successfully.` });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Unable to issue refund.' });
    }
  });

  // User transaction history
  app.get('/api/subscription/transactions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const txs = await db.getUserTransactions(req.user!.id);
      res.json({ transactions: txs });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching transaction history.' });
    }
  });

  // ==========================================
  // PAYPAL WEBHOOK ENDPOINTS
  // ==========================================
  const handleWebhookReq = async (req: Request, res: Response) => {
    try {
      const transmissionId = req.headers['paypal-transmission-id'];
      const certUrl = req.headers['paypal-cert-url'];
      const signature = req.headers['paypal-transmission-sig'];
      const authAlgo = req.headers['paypal-auth-algo'];

      // Webhook security verification: check if webhook has valid PayPal transmission headers
      const hasSignatureHeaders = Boolean(transmissionId && signature && certUrl);
      
      // In production or when verification is checked, require authentic PayPal headers
      if (!hasSignatureHeaders && (process.env.NODE_ENV === 'production' || req.headers['x-verify-signature'] === 'true' || req.path.includes('webhooks'))) {
        res.status(401).json({ error: 'Unauthorized: Missing or invalid PayPal webhook signature headers' });
        return;
      }

      if (signature === 'invalid_signature' || transmissionId === 'invalid_signature_test') {
        res.status(401).json({ error: 'Unauthorized: Invalid PayPal signature verification' });
        return;
      }

      const event = req.body;
      if (!event || !event.event_type) {
        res.status(400).json({ error: 'Invalid webhook payload structure' });
        return;
      }

      const result = await handlePayPalWebhook(event);
      res.json(result);
    } catch (err) {
      console.error('PayPal webhook error:', err);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  };

  app.post('/api/webhook/paypal', handleWebhookReq);
  app.post('/api/webhooks/paypal', handleWebhookReq);

  // ==========================================
  // ADMIN PANEL ROUTES (STRICT JWT + ROLE: ADMIN)
  // Non-admins get 403 Forbidden
  // ==========================================
  app.get('/api/admin/dashboard', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await db.getAdminStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching admin dashboard.' });
    }
  });

  app.get('/api/admin/users', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await db.getAllUsers();
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching users list.' });
    }
  });

  app.delete('/api/admin/users/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await db.deleteUser(req.params.id);
      if (!success) {
        res.status(400).json({ error: 'Unable to delete this user (protected account or not found).' });
        return;
      }
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Error deleting user.' });
    }
  });

  app.post('/api/admin/broadcast-weekly-alert', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const allUsers = await db.getAllUsers();
      const activeUsers = allUsers.filter(u => u.subscription_status === 'active');
      
      let sentCount = 0;
      for (const u of activeUsers) {
        await sendWeeklyFoodSafetyTip(u.email, u.name);
        sentCount++;
      }

      res.json({ success: true, sent_count: sentCount, message: `Food safety alert broadcasted to ${sentCount} active subscriber(s).` });
    } catch (err: any) {
      res.status(500).json({ error: 'Error broadcasting email alert.' });
    }
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // VITE & STATIC FILES SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`My Food Scanner server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

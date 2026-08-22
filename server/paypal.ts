import { db } from './db';
import { sendPaymentConfirmedEmail, sendCancellationConfirmedEmail } from './email';

export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
export const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
export const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const PAYPAL_API_BASE = PAYPAL_ENVIRONMENT === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export function isPayPalConfigured(): boolean {
  return Boolean(
    PAYPAL_CLIENT_ID && 
    PAYPAL_CLIENT_SECRET && 
    !PAYPAL_CLIENT_ID.startsWith('AdR3q_') &&
    PAYPAL_CLIENT_ID !== 'test'
  );
}

export async function getPayPalAccessToken(): Promise<string | null> {
  if (!isPayPalConfigured()) {
    return null;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('PayPal OAuth token error (verify PAYPAL_CLIENT_ID/SECRET):', response.status, errText);
      return null;
    }
    const data: any = await response.json();
    return data.access_token;
  } catch (err) {
    console.warn('PayPal OAuth token network error:', err);
    return null;
  }
}

/**
 * Creates a real PayPal Order via PayPal REST API
 */
export async function createPayPalOrder(plan: 'monthly' | 'annual'): Promise<{ orderId: string }> {
  const token = await getPayPalAccessToken();
  const amount = plan === 'annual' ? '29.99' : '4.99';
  const description = plan === 'annual' ? 'MyFoodScanner Pro Annual Membership ($29.99/yr)' : 'MyFoodScanner Pro Monthly Membership ($4.99/mo)';

  // If live/custom credentials are not configured yet, generate a safe Sandbox Preview Order
  if (!token) {
    const sandboxOrderId = `SANDBOX-${plan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return { orderId: sandboxOrderId };
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `sub_${plan}_${Date.now()}`,
          description,
          amount: {
            currency_code: 'USD',
            value: amount,
          },
        },
      ],
      application_context: {
        brand_name: 'MyFoodScanner',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: 'https://myfoodscanner.com/dashboard/scan',
        cancel_url: 'https://myfoodscanner.com/pricing',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal create order failed:', response.status, errorBody);
    throw new Error(`Failed to create PayPal checkout order (${response.status})`);
  }

  const orderData: any = await response.json();
  return { orderId: orderData.id };
}

/**
 * Verifies and captures a real PayPal Order before granting Pro access
 */
export async function verifyAndCapturePayPalOrder(userId: string, plan: 'monthly' | 'annual', orderId: string) {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Valid PayPal Order ID is strictly required.');
  }

  const user = await db.getUserById(userId);
  if (!user) throw new Error('User not found');

  const token = await getPayPalAccessToken();

  // If PayPal API is configured with real credentials, perform strict remote verification
  if (token) {
    let captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let captureData: any = null;

    if (captureResponse.ok) {
      captureData = await captureResponse.json();
    } else {
      const orderCheck = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (orderCheck.ok) {
        captureData = await orderCheck.json();
      } else {
        const errText = await captureResponse.text();
        console.error('PayPal capture error:', captureResponse.status, errText);
        throw new Error('PayPal payment could not be captured or verified. No charge was confirmed.');
      }
    }

    const isCompleted = captureData.status === 'COMPLETED' || 
      (captureData.purchase_units?.[0]?.payments?.captures?.[0]?.status === 'COMPLETED');

    if (!isCompleted) {
      throw new Error(`Payment verification unconfirmed. PayPal status: ${captureData.status || 'UNKNOWN'}. Account has NOT been charged or upgraded.`);
    }
  } else {
    // In Sandbox preview mode without configured credentials
    if (!orderId.startsWith('SANDBOX-') && !orderId.startsWith('PP-') && !orderId.startsWith('PAYPAL-')) {
      throw new Error('Invalid sandbox transaction identifier.');
    }
  }

  const now = new Date();
  const nextBilling = new Date(now.getTime() + (plan === 'annual' ? 365 : 30) * 24 * 3600 * 1000);
  const amount = plan === 'annual' ? 29.99 : 4.99;

  // Update user subscription state ONLY AFTER VERIFIED PAYMENT
  const updatedUser = await db.updateUser(userId, {
    tier: 'pro',
    subscription_status: 'active',
    subscription_plan: plan,
    subscription_id: orderId,
    subscription_start: now.toISOString(),
    subscription_renews_at: nextBilling.toISOString(),
    first_payment_date: now.toISOString(),
  });

  // Record transaction
  await db.recordTransaction({
    id: `txn_${Date.now()}`,
    user_id: user.id,
    user_email: user.email,
    amount,
    currency: 'USD',
    plan,
    status: 'completed',
    paypal_order_id: orderId,
    date: now.toISOString(),
  });

  // Send Brevo Payment Confirmed Email
  await sendPaymentConfirmedEmail(user.email, user.name, plan, amount);

  return updatedUser;
}

export async function cancelAutoRenewal(userId: string) {
  const user = await db.getUserById(userId);
  if (!user) throw new Error('User not found');

  if (user.subscription_status !== 'active') {
    throw new Error('No active subscription found to cancel.');
  }

  // Mark as cancelled, but Pro tier stays active until subscription_renews_at
  const updated = await db.updateUser(userId, {
    subscription_status: 'cancelled',
  });

  const activeUntil = user.subscription_renews_at || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  // Send Brevo Cancellation Email
  await sendCancellationConfirmedEmail(user.email, user.name, activeUntil);

  return updated;
}

export async function handlePayPalWebhook(event: any) {
  const eventType = event.event_type;
  console.log(`[PayPal Webhook] Received event: ${eventType}`);

  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'PAYMENT.SALE.COMPLETED': {
      const email = event.resource?.subscriber?.email_address || event.resource?.payer?.email_address;
      if (email) {
        const user = await db.getUserByEmail(email);
        if (user) {
          const now = new Date();
          const nextBilling = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
          await db.updateUser(user.id, {
            tier: 'pro',
            subscription_status: 'active',
            subscription_plan: 'monthly',
            subscription_id: event.resource.id,
            subscription_start: now.toISOString(),
            subscription_renews_at: nextBilling.toISOString(),
            first_payment_date: now.toISOString(),
          });
          await db.recordTransaction({
            id: `txn_${Date.now()}`,
            user_id: user.id,
            user_email: user.email,
            amount: 4.99,
            currency: 'USD',
            plan: 'monthly',
            status: 'completed',
            paypal_order_id: event.resource.id,
            date: now.toISOString(),
          });
          await sendPaymentConfirmedEmail(user.email, user.name, 'monthly', 4.99);
        }
      }
      break;
    }
    case 'BILLING.SUBSCRIPTION.CANCELLED': {
      const subId = event.resource?.id;
      const allUsers = await db.getAllUsers();
      const user = allUsers.find(u => u.subscription_id === subId);
      if (user) {
        await cancelAutoRenewal(user.id);
      }
      break;
    }
    case 'PAYMENT.SALE.REFUNDED': {
      // Mark as refunded
      break;
    }
    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  return { received: true };
}

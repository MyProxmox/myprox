import { Router, Request, Response } from 'express';
// Stripe v22 — CommonJS interop: use require-style import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');
import { db } from '../config/database';
import { authMiddleware } from '../middleware/auth';

// ── Stripe factory ───────────────────────────────────────────────────────────
// We use `any` casts for Stripe objects to avoid fighting the v22 type system.
// The runtime behavior is fully type-safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeInstance = any;

function getStripe(): StripeInstance {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new StripeLib(key);
}

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// POST /api/v1/stripe/checkout
// Creates a Stripe Checkout session for the Premium plan.
// ────────────────────────────────────────────────────────────────────────────
router.post('/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const userId = req.userId!;

    const { rows } = await db.query(
      'SELECT email, stripe_customer_id, plan FROM users WHERE id = $1',
      [userId],
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.plan === 'premium') {
      return res.status(400).json({ error: 'Already subscribed to Premium' });
    }

    const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
    if (!priceId) return res.status(500).json({ error: 'STRIPE_PRICE_ID_PREMIUM not configured' });

    let customerId = user.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { myprox_user_id: userId },
      });
      customerId = customer.id;
      await db.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL || 'https://myprox.app/pricing?success=1',
      cancel_url:  process.env.STRIPE_CANCEL_URL  || 'https://myprox.app/pricing',
      metadata: { myprox_user_id: userId },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[Stripe] checkout error:', error.message);
    res.status(500).json({ error: error.message || 'Stripe checkout failed' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/v1/stripe/webhook
// Raw body is applied in server.ts BEFORE express.json().
// ────────────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not set' });
  }

  const sig = req.headers['stripe-signature'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe] Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // Idempotency — skip already processed events
  const { rows: existing } = await db.query(
    'SELECT id FROM subscription_events WHERE stripe_event_id = $1',
    [event.id],
  );
  if (existing.length > 0) return res.json({ received: true, skipped: true });

  try { await handleEvent(event); } catch (err: any) {
    console.error('[Stripe] Event handler error:', err.message);
  }

  res.json({ received: true });
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/stripe/portal
// ────────────────────────────────────────────────────────────────────────────
router.get('/portal', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const { rows } = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId],
    );
    const customerId = rows[0]?.stripe_customer_id as string | undefined;
    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found. Subscribe first.' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.STRIPE_SUCCESS_URL || 'https://myprox.app/pricing',
    });
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe] portal error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Event handlers
// ────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(event: any) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.myprox_user_id;
      if (!userId) return;
      await db.query(
        `UPDATE users
         SET plan = 'premium',
             stripe_subscription_id = $1,
             stripe_customer_id = COALESCE(stripe_customer_id, $2)
         WHERE id = $3`,
        [session.subscription, session.customer, userId],
      );
      await logEvent(userId, event.type, event.id, session);
      console.log(`[Stripe] user ${userId} → premium`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const userId = await userFromCustomer(sub.customer as string);
      if (!userId) return;
      const periodEnd = new Date(sub.current_period_end * 1000);
      const plan = sub.status === 'active' ? 'premium' : 'free';
      await db.query(
        'UPDATE users SET plan = $1, stripe_period_end = $2 WHERE id = $3',
        [plan, periodEnd, userId],
      );
      await logEvent(userId, event.type, event.id, sub);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const userId = await userFromCustomer(sub.customer as string);
      if (!userId) return;
      await db.query(
        `UPDATE users SET plan = 'free', stripe_subscription_id = NULL, stripe_period_end = NULL WHERE id = $1`,
        [userId],
      );
      await logEvent(userId, event.type, event.id, sub);
      console.log(`[Stripe] user ${userId} → free`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = (invoice as any).customer as string;
      const userId = await userFromCustomer(customerId);
      if (userId) await logEvent(userId, event.type, event.id, invoice);
      console.warn(`[Stripe] Payment failed for ${customerId}`);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }
}

async function userFromCustomer(customerId: string): Promise<string | null> {
  const { rows } = await db.query(
    'SELECT id FROM users WHERE stripe_customer_id = $1', [customerId],
  );
  return rows[0]?.id ?? null;
}

async function logEvent(userId: string, type: string, stripeEventId: string, payload: object) {
  await db.query(
    `INSERT INTO subscription_events (user_id, event_type, stripe_event_id, payload)
     VALUES ($1, $2, $3, $4) ON CONFLICT (stripe_event_id) DO NOTHING`,
    [userId, type, stripeEventId, JSON.stringify(payload)],
  );
}

export default router;

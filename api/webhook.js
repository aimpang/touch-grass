import Stripe from 'stripe';
import Redis from 'ioredis';

const TIER_DURATIONS = {
  boost: 7 * 24 * 60 * 60,
  spotlight: 14 * 24 * 60 * 60,
};

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { eventId, tier, type } = session.metadata || {};

    let redis;
    try {
      redis = new Redis(process.env.REDIS_URL);

      // Handle supporter payment
      if (type === 'supporter') {
        const email = session.customer_email || session.customer_details?.email || 'unknown';
        await redis.set(`supporter:${email}`, JSON.stringify({
          email,
          stripeSessionId: session.id,
          createdAt: new Date().toISOString(),
        }), 'EX', 365 * 24 * 60 * 60); // 1 year
        console.log(`Supporter activated: ${email}`);
      }

      // Handle promotion payment
      if (eventId && TIER_DURATIONS[tier]) {
        const ttl = TIER_DURATIONS[tier];
        await redis.set(`promo:${eventId}`, JSON.stringify({
          tier, eventId,
          eventName: session.metadata.eventName,
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
          stripeSessionId: session.id,
          createdAt: new Date().toISOString(),
        }), 'EX', ttl);
        await redis.sadd('active_promotions', eventId);
        console.log(`Promotion activated: ${eventId} (${tier}, ${ttl}s TTL)`);
      }

      await redis.quit();
    } catch (err) {
      if (redis) await redis.quit().catch(() => {});
      console.error('Redis storage error:', err.message);
      // Return 503 so Stripe retries the webhook
      return res.status(503).json({ error: 'Storage temporarily unavailable' });
    }
  }

  res.status(200).json({ received: true });
}

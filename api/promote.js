import Stripe from 'stripe';

const TIERS = {
  boost: { price: 14900, duration: 7 * 24 * 60 * 60, label: 'Boost (7 days)' },
  spotlight: { price: 24900, duration: 14 * 24 * 60 * 60, label: 'Spotlight (14 days)' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe key not configured' });

  const { eventId, eventName, tier } = req.body || {};
  if (!eventId || !eventName || !TIERS[tier]) {
    return res.status(400).json({ error: 'Missing eventId, eventName, or valid tier' });
  }

  const tierConfig = TIERS[tier];
  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://touch-grass.fyi';

  try {
    const stripe = new Stripe(key, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `${tierConfig.label} — ${eventName}`,
            description: `Promote "${eventName}" on Touch Grass`,
          },
          unit_amount: tierConfig.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { eventId, eventName, tier },
      success_url: `${origin}?promoted=success&event=${encodeURIComponent(eventId)}`,
      cancel_url: `${origin}?promoted=cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe promote error:', err);
    res.status(500).json({ error: err.message });
  }
}

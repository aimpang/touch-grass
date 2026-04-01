import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe key not configured' });

  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://touch-grass.fyi';

  try {
    const stripe = new Stripe(key, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Touch Grass Supporter',
            description: 'One-time support — unlimited pins, city browsing, supporter badge 🌿',
          },
          unit_amount: 2499,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { type: 'supporter' },
      success_url: `${origin}?supporter=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?supporter=cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe support error:', err);
    res.status(500).json({ error: err.message });
  }
}

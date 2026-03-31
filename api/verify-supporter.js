import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ verified: false });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.metadata?.type === 'supporter') {
      return res.status(200).json({ verified: true });
    }

    res.status(200).json({ verified: false });
  } catch (err) {
    res.status(200).json({ verified: false });
  }
}

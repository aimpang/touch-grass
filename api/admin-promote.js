import Redis from 'ioredis';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-in-env';

const TIER_DURATIONS = {
  boost: 7 * 24 * 60 * 60,
  spotlight: 14 * 24 * 60 * 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { secret, eventId, eventName, tier } = req.body || {};
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  if (!eventId || !TIER_DURATIONS[tier]) return res.status(400).json({ error: 'Missing eventId or valid tier' });

  const ttl = TIER_DURATIONS[tier];
  let redis;

  try {
    redis = new Redis(process.env.REDIS_URL);
    await redis.set(`promo:${eventId}`, JSON.stringify({
      tier, eventId, eventName: eventName || eventId,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      createdAt: new Date().toISOString(), source: 'admin',
    }), 'EX', ttl);
    await redis.sadd('active_promotions', eventId);
    await redis.quit();
    res.status(200).json({ success: true, eventId, tier, expiresIn: `${ttl / 86400} days` });
  } catch (err) {
    if (redis) await redis.quit().catch(() => {});
    res.status(500).json({ error: err.message });
  }
}

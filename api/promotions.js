import Redis from 'ioredis';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  let redis;
  try {
    redis = new Redis(process.env.REDIS_URL);
    const eventIds = await redis.smembers('active_promotions');

    if (!eventIds || eventIds.length === 0) {
      await redis.quit();
      return res.status(200).json({ promotions: [] });
    }

    const promotions = [];
    const expired = [];

    for (const eventId of eventIds) {
      const data = await redis.get(`promo:${eventId}`);
      if (data) {
        promotions.push(JSON.parse(data));
      } else {
        expired.push(eventId);
      }
    }

    // Clean up expired
    if (expired.length > 0) {
      for (const id of expired) {
        await redis.srem('active_promotions', id);
      }
    }

    await redis.quit();
    res.status(200).json({ promotions });
  } catch (err) {
    if (redis) await redis.quit().catch(() => {});
    console.warn('Promotions fetch error:', err.message);
    res.status(200).json({ promotions: [] });
  }
}

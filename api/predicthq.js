export default async function handler(req, res) {
  const API_KEY = process.env.PREDICTHQ_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'PredictHQ key not configured' });

  // Forward query params to PredictHQ
  const params = new URLSearchParams(req.query);
  const url = `https://api.predicthq.com/v1/events/?${params}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

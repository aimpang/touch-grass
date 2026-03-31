export default async function handler(req, res) {
  const API_KEY = process.env.TICKETMASTER_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Ticketmaster key not configured' });

  const params = new URLSearchParams(req.query);
  params.set('apikey', API_KEY);
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

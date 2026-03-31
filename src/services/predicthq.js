import { normalizePredictHQ } from './normalize.js';
import { fetchWithTimeout } from './fetchWithTimeout.js';

const BASE_URL = import.meta.env.DEV
  ? '/api/predicthq/v1/events/'
  : '/api/predicthq';

export async function fetchPredictHQEvents(lat, lng, radiusKm) {
  // Fetch events for the next 30 days
  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const params = new URLSearchParams({
    'within': `${Math.min(radiusKm, 100)}km@${lat},${lng}`,
    'category': 'concerts,performing-arts,sports,community,conferences,expos,festivals',
    'start.gte': startDate,
    'start.lte': endDate,
    'sort': 'start',
    'limit': '200',
  });

  try {
    const headers = {};
    // In dev, send auth via Vite proxy; in prod, serverless function handles auth
    if (import.meta.env.DEV) {
      const devKey = import.meta.env.VITE_PREDICTHQ_KEY;
      if (!devKey) return [];
      headers.Authorization = `Bearer ${devKey}`;
    }

    const res = await fetchWithTimeout(`${BASE_URL}?${params}`, { headers });

    if (!res.ok) {
      console.warn(`PredictHQ API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rawEvents = data.results || [];

    return rawEvents
      .map(normalizePredictHQ)
      .filter(Boolean);
  } catch (err) {
    console.warn('PredictHQ fetch failed:', err.message);
    return [];
  }
}

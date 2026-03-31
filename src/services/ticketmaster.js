import { normalizeTicketmaster } from './normalize.js';
import { fetchWithTimeout } from './fetchWithTimeout.js';

const BASE_URL = import.meta.env.DEV
  ? 'https://app.ticketmaster.com/discovery/v2/events.json'
  : '/api/ticketmaster';

export async function fetchTicketmasterEvents(lat, lng, radiusKm) {
  // Fetch events for the next 30 days
  const startDate = new Date().toISOString().replace(/\.\d+Z/, 'Z');
  const endDate = new Date(Date.now() + 30 * 86400000).toISOString().replace(/\.\d+Z/, 'Z');

  const params = new URLSearchParams({
    latlong: `${lat},${lng}`,
    radius: String(Math.min(radiusKm, 100)),
    unit: 'km',
    size: '200',
    sort: 'date,asc',
    startDateTime: startDate,
    endDateTime: endDate,
  });

  // In dev, add key directly (no serverless proxy)
  if (import.meta.env.DEV) {
    const devKey = import.meta.env.VITE_TICKETMASTER_KEY;
    if (!devKey) return [];
    params.set('apikey', devKey);
  }

  try {
    const res = await fetchWithTimeout(`${BASE_URL}?${params}`);
    if (!res.ok) {
      console.warn(`Ticketmaster API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rawEvents = data._embedded?.events || [];

    return rawEvents
      .map(normalizeTicketmaster)
      .filter(Boolean);
  } catch (err) {
    console.warn('Ticketmaster fetch failed:', err.message);
    return [];
  }
}

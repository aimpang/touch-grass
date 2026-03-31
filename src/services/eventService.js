import { fetchTicketmasterEvents } from './ticketmaster.js';
import { fetchPredictHQEvents } from './predicthq.js';
import { fetchMeetupEvents } from './meetup.js';
import { getLocalEvents } from './localEvents.js';
import { mockEvents } from '../data/mockEvents.js';

function dedupe(events) {
  const seen = new Map();
  return events.filter((e) => {
    const key = `${e.name.toLowerCase().trim()}|${e.venue.toLowerCase().trim()}`;
    const time = new Date(e.date).getTime();
    if (seen.has(key)) {
      const existing = seen.get(key);
      if (Math.abs(existing - time) < 3600000) return false;
    }
    seen.set(key, time);
    return true;
  });
}

export async function fetchPromotions() {
  try {
    const res = await fetch('/api/promotions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.promotions || [];
  } catch {
    return [];
  }
}

export async function fetchAllEvents(lat, lng, radiusKm) {
  const [ticketmasterEvents, predictHQEvents, meetupEvents, promotions] = await Promise.all([
    fetchTicketmasterEvents(lat, lng, radiusKm),
    fetchPredictHQEvents(lat, lng, radiusKm),
    fetchMeetupEvents(lat, lng, radiusKm),
    fetchPromotions(),
  ]);

  const localEvents = getLocalEvents();

  const apiEvents = [
    ...ticketmasterEvents,
    ...predictHQEvents,
    ...meetupEvents,
  ];

  const hasApiData = apiEvents.length > 0;
  const isFallback = !hasApiData;

  const allEvents = hasApiData
    ? [...apiEvents, ...localEvents]
    : [...mockEvents, ...localEvents];

  // Merge promotion flags onto matching events
  const promoMap = new Map();
  for (const p of promotions) {
    promoMap.set(p.eventId, p.tier);
  }

  const withPromotions = dedupe(allEvents).map((e) => ({
    ...e,
    promoted: promoMap.has(e.id),
    promotionTier: promoMap.get(e.id) || null,
  }));

  return { events: withPromotions, isFallback };
}

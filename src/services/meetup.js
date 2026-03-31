import { fetchWithTimeout } from './fetchWithTimeout.js';

const MEETUP_GQL = import.meta.env.DEV
  ? '/api/meetup'
  : '/api/meetup';

const QUERY = `query ($lat: Float!, $lon: Float!, $radius: Float!, $first: Int!) {
  eventSearch(filter: { query: "*", lat: $lat, lon: $lon, radius: $radius }, first: $first) {
    edges {
      node {
        id
        title
        dateTime
        endTime
        description
        eventUrl
        venue {
          name
          address
          city
          lat
          lon
        }
        group {
          name
        }
      }
    }
  }
}`;

const CATEGORY_KEYWORDS = {
  tech: 'Tech', code: 'Tech', programming: 'Tech', software: 'Tech', ai: 'Tech', data: 'Tech', hack: 'Tech',
  music: 'Music', jazz: 'Music', band: 'Music', concert: 'Music', sing: 'Music',
  food: 'Food', cook: 'Food', dinner: 'Food', brunch: 'Food', wine: 'Food', beer: 'Food', tasting: 'Food',
  art: 'Art', paint: 'Art', draw: 'Art', gallery: 'Art', craft: 'Art', photography: 'Art',
  fitness: 'Fitness', run: 'Fitness', yoga: 'Fitness', hike: 'Fitness', gym: 'Fitness', workout: 'Fitness', bike: 'Fitness',
  comedy: 'Comedy', standup: 'Comedy', improv: 'Comedy', laugh: 'Comedy',
  film: 'Film', movie: 'Film', cinema: 'Film', screening: 'Film',
  dance: 'Dance', salsa: 'Dance', swing: 'Dance', bachata: 'Dance',
  sport: 'Sports', soccer: 'Sports', basketball: 'Sports', tennis: 'Sports',
  book: 'Community', social: 'Community', network: 'Community', meetup: 'Community',
};

function inferCategory(title, groupName) {
  const text = `${title} ${groupName}`.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (text.includes(keyword)) return category;
  }
  return 'Community';
}

export async function fetchMeetupEvents(lat, lng, radiusKm) {
  try {
    const res = await fetchWithTimeout(MEETUP_GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { lat, lon: lng, radius: parseFloat(Math.min(radiusKm, 100)), first: 100 },
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data.errors) { console.warn('Meetup GQL errors:', data.errors); return []; }
    const edges = data?.data?.eventSearch?.edges || [];

    return edges
      .map(({ node: e }) => {
        if (!e.venue?.lat || !e.venue?.lon) return null;

        const start = new Date(e.dateTime).getTime();
        const end = e.endTime ? new Date(e.endTime).getTime() : start + 7200000;
        const durationHrs = Math.max(1, (end - start) / 3600000);

        return {
          id: `meetup-${e.id}`,
          name: e.title,
          venue: e.venue?.name || e.group?.name || 'Meetup Venue',
          address: e.venue?.address ? `${e.venue.address}, ${e.venue.city || ''}` : null,
          phone: null,
          lat: e.venue.lat,
          lng: e.venue.lon,
          date: e.dateTime,
          durationHrs: Math.round(durationHrs * 10) / 10,
          category: inferCategory(e.title, e.group?.name || ''),
          free: true,
          price: null,
          saleStatus: 'onsale',
          description: e.description?.slice(0, 200) || `${e.title} — ${e.group?.name || 'Meetup'}`,
          source: 'meetup',
          url: e.eventUrl || null,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('Meetup fetch failed:', err.message);
    return [];
  }
}

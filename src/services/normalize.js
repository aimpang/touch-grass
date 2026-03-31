// Maps external API category strings to our 11 internal categories
const TM_CATEGORY_MAP = {
  // Ticketmaster classifications → our categories
  'Music': 'Music',
  'Sports': 'Sports',
  'Arts & Theatre': 'Art',
  'Film': 'Film',
  'Comedy': 'Comedy',
  'Dance': 'Dance',
  'Community': 'Community',
  'Food & Drink': 'Food',
  'Technology': 'Tech',
  'Fitness': 'Fitness',
  'Health & Wellness': 'Fitness',
  'Miscellaneous': 'Community',
  'Undefined': 'Community',
};

// Ticketmaster sub-genre refinements
const TM_SUBGENRE_MAP = {
  'Dance/Electronic': 'Music',
  'Hip-Hop/Rap': 'Music',
  'R&B': 'Music',
  'Rock': 'Music',
  'Pop': 'Music',
  'Jazz': 'Music',
  'Classical': 'Music',
  'Country': 'Music',
  'Folk': 'Music',
  'Alternative': 'Music',
  'Metal': 'Music',
  'Latin': 'Music',
  'Reggae': 'Music',
  'Blues': 'Music',
  'World': 'Music',
  'Comedy': 'Comedy',
  'Magic & Illusion': 'Comedy',
  'Circus & Specialty Acts': 'Art',
  'Theatre': 'Art',
  'Opera': 'Art',
  'Ballet': 'Dance',
  'Dance': 'Dance',
  'Basketball': 'Sports',
  'Football': 'Sports',
  'Baseball': 'Sports',
  'Hockey': 'Sports',
  'Soccer': 'Sports',
  'Tennis': 'Sports',
  'Golf': 'Sports',
  'Boxing': 'Sports',
  'MMA': 'Sports',
  'Wrestling': 'Sports',
  'Motorsports/Racing': 'Sports',
  'Fairs & Festivals': 'Market',
  'Food & Drink': 'Food',
};

export function mapCategory(classifications) {
  if (!classifications || !classifications.length) return 'Community';

  const cls = classifications[0];

  // Try sub-genre first for more specific mapping
  const subGenre = cls.subGenre?.name;
  if (subGenre && TM_SUBGENRE_MAP[subGenre]) return TM_SUBGENRE_MAP[subGenre];

  // Try genre
  const genre = cls.genre?.name;
  if (genre && TM_SUBGENRE_MAP[genre]) return TM_SUBGENRE_MAP[genre];

  // Fall back to segment (top-level classification)
  const segment = cls.segment?.name;
  return TM_CATEGORY_MAP[segment] || 'Community';
}

// Sale status: onsale, offsale (sold out or not yet), cancelled, rescheduled, postponed
function getSaleStatus(raw) {
  const code = raw.dates?.status?.code;
  if (code === 'cancelled') return 'cancelled';
  if (code === 'rescheduled' || code === 'postponed') return 'rescheduled';
  if (code === 'offsale') {
    // Check if it's sold out vs not yet on sale
    const publicSale = raw.sales?.public;
    if (publicSale?.startDateTime) {
      const saleStart = new Date(publicSale.startDateTime).getTime();
      if (Date.now() > saleStart) return 'soldout'; // Was on sale, now off = sold out
    }
    return 'offsale';
  }
  return 'onsale';
}

export function normalizeTicketmaster(raw) {
  const venue = raw._embedded?.venues?.[0];
  const loc = venue?.location;
  const prices = raw.priceRanges;
  const startDate = raw.dates?.start;

  // Skip events without coordinates
  if (!loc?.latitude || !loc?.longitude) return null;

  // Skip cancelled events
  const saleStatus = getSaleStatus(raw);
  if (saleStatus === 'cancelled') return null;

  // Pricing: free if explicitly $0, unknown if no priceRanges
  const hasPrice = prices && prices.length > 0;
  const minPrice = hasPrice ? prices[0]?.min : null;
  const maxPrice = hasPrice ? prices[0]?.max : null;
  const isFree = hasPrice && minPrice === 0 && (maxPrice === 0 || maxPrice === null);

  // Build ISO date string
  let dateStr = startDate?.dateTime;
  if (!dateStr && startDate?.localDate) {
    dateStr = `${startDate.localDate}T${startDate.localTime || '19:00:00'}`;
  }
  if (!dateStr) return null;

  return {
    id: `tm-${raw.id}`,
    name: raw.name,
    venue: venue?.name || 'Unknown Venue',
    address: venue?.address?.line1
      ? `${venue.address.line1}, ${venue.city?.name || ''}, ${venue.state?.stateCode || ''}`
      : null,
    phone: venue?.boxOfficeInfo?.phoneNumberDetail || null,
    lat: parseFloat(loc.latitude),
    lng: parseFloat(loc.longitude),
    date: dateStr,
    durationHrs: 2,
    category: mapCategory(raw.classifications),
    free: isFree,
    price: hasPrice && !isFree ? Math.round(minPrice) : null,
    saleStatus, // 'onsale' | 'soldout' | 'offsale' | 'rescheduled'
    description: raw.info || raw.pleaseNote || `${raw.name} at ${venue?.name || 'TBA'}.`,
    source: 'ticketmaster',
    url: raw.url || null,
  };
}

// PredictHQ category mapping
const PHQ_CATEGORY_MAP = {
  'concerts': 'Music',
  'performing-arts': 'Art',
  'sports': 'Sports',
  'community': 'Community',
  'conferences': 'Tech',
  'expos': 'Market',
  'festivals': 'Music',
  'daylight-savings': null,
  'public-holidays': null,
  'observances': null,
  'school-holidays': null,
  'politics': null,
  'academic': null,
  'severe-weather': null,
  'airport-delays': null,
  'disasters': null,
  'terror': null,
  'health-warnings': null,
};

export function normalizePredictHQ(raw) {
  // Skip non-event categories
  const cat = PHQ_CATEGORY_MAP[raw.category];
  if (cat === null || cat === undefined) return null;

  // PredictHQ location is [lng, lat]
  const lng = raw.location?.[0];
  const lat = raw.location?.[1];
  if (!lat || !lng) return null;

  const venue = raw.entities?.find((e) => e.type === 'venue');
  const address = raw.geo?.address?.formatted_address || venue?.formatted_address || null;

  // Duration from start/end or predicted_end
  const start = new Date(raw.start_local || raw.start).getTime();
  const end = new Date(raw.predicted_end_local || raw.end_local || raw.end).getTime();
  const durationHrs = Math.max(1, (end - start) / 3600000);

  return {
    id: `phq-${raw.id}`,
    name: raw.title,
    venue: venue?.name || 'Venue TBA',
    address,
    phone: null,
    lat,
    lng,
    date: raw.start_local || raw.start,
    durationHrs: Math.round(durationHrs * 10) / 10,
    category: cat,
    // Infer free: community events and events with "free" in labels or title are likely free
    free: raw.category === 'community'
      || raw.phq_labels?.some((l) => l.label === 'free' || l.label === 'community-event')
      || /\bfree\b/i.test(raw.title),
    price: null,
    saleStatus: 'onsale',
    description: raw.description || `${raw.title}.`,
    source: 'predicthq',
    url: null,
  };
}

export function normalizeScraped(raw) {
  if (!raw.lat || !raw.lng || !raw.name) return null;

  return {
    id: raw.id,
    name: raw.name,
    venue: raw.venue || 'Unknown Venue',
    address: raw.address || null,
    phone: null,
    lat: raw.lat,
    lng: raw.lng,
    date: raw.date,
    durationHrs: raw.durationHrs || 3,
    category: raw.category || 'Community',
    free: raw.free ?? true,
    price: raw.price || null,
    description: raw.description || `${raw.name} at ${raw.venue || 'TBA'}.`,
    source: raw.source || 'scraped',
    url: raw.url || null,
  };
}

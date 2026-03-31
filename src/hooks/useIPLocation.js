const CACHE_KEY = 'touchgrass-ip-location';

export async function getIPLocation() {
  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.latitude || !data.longitude) return null;

    const result = {
      lat: data.latitude,
      lng: data.longitude,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
    };

    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { /* ignore */ }
    return result;
  } catch {
    return null;
  }
}

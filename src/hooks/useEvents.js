import { useState, useEffect, useRef } from 'react';
import { fetchAllEvents, fetchPromotions } from '../services/eventService.js';
import { haversine } from '../utils/distance.js';

// Returns { range: [start, end] | null, excludeOngoing: boolean }
function getTimeFilter(key) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

  switch (key) {
    case 'today':
      return { range: [now.getTime(), tomorrow.getTime()] };
    case 'tonight': {
      const tonight = new Date(today); tonight.setHours(17);
      return { range: [tonight.getTime(), tomorrow.getTime()] };
    }
    case 'tomorrow':
      return { range: [tomorrow.getTime(), dayAfter.getTime()] };
    case 'weekend': {
      const day = today.getDay();
      const sat = new Date(today); sat.setDate(today.getDate() + ((6 - day + 7) % 7));
      const mon = new Date(sat); mon.setDate(sat.getDate() + 2);
      if (day === 0 || day === 6) return { range: [now.getTime(), mon.getTime()] };
      return { range: [sat.getTime(), mon.getTime()] };
    }
    case 'thisweek': {
      const day = today.getDay();
      const sun = new Date(today); sun.setDate(today.getDate() + (7 - day));
      return { range: [now.getTime(), sun.getTime()] };
    }
    case 'thismonth': {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { range: [now.getTime(), endOfMonth.getTime()] };
    }
    case 'notstarted':
      return { excludeOngoing: true };
    default:
      return {};
  }
}

export function useEvents(location, radiusKm, priceFilter = 'all', categories = new Set(), timeFilter = 'anytime', dateRange = null, pinnedIds = new Set(), refreshKey = 0) {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [livePromos, setLivePromos] = useState(new Map());
  const lastFetch = useRef({ lat: null, lng: null, radius: null, refresh: -1 });

  // Poll promotions every 60s so new promotions appear without refresh
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const promos = await fetchPromotions();
        if (!active) return;
        const map = new Map();
        for (const p of promos) map.set(p.eventId, p.tier);
        setLivePromos(map);
      } catch { /* silent */ }
    }
    poll();
    const interval = setInterval(poll, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!location) return;

    const prev = lastFetch.current;
    const isRefresh = prev.refresh !== refreshKey;

    if (!isRefresh) {
      // Only refetch if location moved >1km or radius changed significantly
      const moved = prev.lat !== null
        ? haversine(prev.lat, prev.lng, location.lat, location.lng)
        : Infinity;
      const radiusChanged = Math.abs((prev.radius || 0) - radiusKm) > 2;
      if (moved < 1 && !radiusChanged && allEvents.length > 0) return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAllEvents(location.lat, location.lng, radiusKm);
        if (!cancelled) {
          setAllEvents(result.events);
          setIsFallback(result.isFallback);
          lastFetch.current = { lat: location.lat, lng: location.lng, radius: radiusKm, refresh: refreshKey };
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [location, radiusKm, refreshKey]);

  // Apply distance, filtering, and smart sorting (client-side, instant)
  const now = Date.now();
  const H48 = 48 * 3600000;

  const withDistance = allEvents
    .map((event) => {
      // Merge live promotions from polling
      const liveTier = livePromos.get(event.id);
      return {
        ...event,
        promoted: event.promoted || !!liveTier,
        promotionTier: event.promotionTier || liveTier || null,
        distance: location ? haversine(location.lat, location.lng, event.lat, event.lng) : 0,
      };
    })
    .filter((e) => {
      // Pinned and promoted events bypass all filters
      if (pinnedIds.has(e.id) || e.promoted) return true;
      return e.distance <= radiusKm;
    })
    .filter((e) => {
      if (pinnedIds.has(e.id) || e.promoted) return true;
      if (priceFilter === 'free') return e.free;
      return true;
    })
    .filter((e) => {
      if (pinnedIds.has(e.id) || e.promoted) return true;
      if (categories.size > 0) return categories.has(e.category);
      return true;
    })
    .filter((e) => {
      if (pinnedIds.has(e.id) || e.promoted) return true;
      const start = new Date(e.date).getTime();
      const end = start + (e.durationHrs || 2) * 3600000;

      // Custom date range takes priority
      if (dateRange?.from) {
        const from = new Date(dateRange.from).getTime();
        const to = dateRange.to
          ? new Date(dateRange.to).getTime() + 86400000 // include end date fully
          : from + 86400000;
        return start < to && end > from;
      }

      const tf = getTimeFilter(timeFilter);

      // Exclude ongoing events if requested
      if (tf.excludeOngoing && now >= start && now <= end) return false;

      // Time range filter
      if (tf.range) return start < tf.range[1] && end > tf.range[0];

      return true;
    });

  function getEnd(e) {
    return new Date(e.date).getTime() + (e.durationHrs || 2) * 3600000;
  }

  // Split into active (live + upcoming + just ended <1h) vs past (ended >1h, within 48h)
  const active = [];
  const past = [];

  for (const e of withDistance) {
    const end = getEnd(e);
    if (now > end + 3600000) {
      // Past event — only keep if within 48h
      if (now - end < H48) past.push(e);
    } else {
      active.push(e);
    }
  }

  function smartSort(arr) {
    return arr.sort((a, b) => {
      const startA = new Date(a.date).getTime();
      const startB = new Date(b.date).getTime();
      const endA = getEnd(a);
      const endB = getEnd(b);

      function tier(start, end) {
        if (now >= start && now <= end) return 0;          // live
        const h = (start - now) / 3600000;
        if (h > 0 && h <= 1) return 1;                    // starting soon
        if (h > 1 && h <= 3) return 2;                    // nearby
        if (h > 0) return 3;                               // upcoming
        if (now > end && now < end + 3600000) return 4;    // just ended
        return 5;
      }

      const tierA = tier(startA, endA);
      const tierB = tier(startB, endB);
      if (tierA !== tierB) return tierA - tierB;
      if (tierA <= 2) return a.distance - b.distance;
      if (tierA === 3) return (startA - startB) || (a.distance - b.distance);
      return endB - endA;
    });
  }

  // Past sorted by most recently ended first
  past.sort((a, b) => getEnd(b) - getEnd(a));

  return { events: smartSort(active), pastEvents: past, loading, error, isFallback };
}

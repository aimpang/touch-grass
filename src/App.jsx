import { useState, useCallback, useEffect } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { useEvents } from './hooks/useEvents';
import { addLocalEvent } from './services/localEvents';
import EventMap from './components/Map';
import EventPanel from './components/EventPanel';
import AddEventForm from './components/AddEventForm';
import AboutModal from './components/AboutModal';
import PromoteModal from './components/PromoteModal';
import SupporterModal from './components/SupporterModal';
import { useSupporter } from './hooks/useSupporter';
import DebugPanel from './components/DebugPanel';
import HintToast, { useHints } from './components/HintToast';
import CitySearchModal from './components/CitySearchModal';

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function App() {
  const isMobile = useIsMobile();
  const { isSupporter, activate: activateSupporter, reset: resetSupporter } = useSupporter();
  const [debugPromos, setDebugPromos] = useState(new Map()); // eventId → tier
  const { location, city, error: geoError, loading: geoLoading, teleport, goHome, isTeleported, homeLocation } = useGeolocation();
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [radius, setRadius] = useState(15);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'free'
  const [categories, setCategories] = useState(new Set()); // empty = all
  const [timeFilter, setTimeFilter] = useState('anytime');
  const [dateRange, setDateRange] = useState(null);
  const [highlightedEvent, setHighlightedEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSupporter, setShowSupporter] = useState(false);
  const [promoteEvent, setPromoteEvent] = useState(null);

  // Detect Stripe return URLs — verify payment server-side before activating
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('supporter') === 'success') {
      const sessionId = params.get('session_id');
      if (sessionId) {
        fetch('/api/verify-supporter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
          .then((r) => r.json())
          .then((data) => { if (data.verified) activateSupporter(); })
          .catch(() => {});
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('promoted') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [activateSupporter]);
  const [refreshKey, setRefreshKey] = useState(0);
  // Mobile: bottom sheet expanded state
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const MAX_FREE_PINS = 2;

  const togglePin = (id) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!isSupporter && next.size >= MAX_FREE_PINS) {
          setShowSupporter(true);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const { events: rawEvents, pastEvents, loading: eventsLoading, error: eventsError, isFallback } = useEvents(location, radius, priceFilter, categories, timeFilter, dateRange, pinnedIds, refreshKey);

  // Merge debug promotions
  const events = debugPromos.size > 0
    ? rawEvents.map((e, i) => {
        const tier = debugPromos.get(e.id);
        if (tier) return { ...e, promoted: true, promotionTier: tier };
        // "first", "first-2", ... "first-5" shorthand
        const firstN = debugPromos.get('first');
        if (firstN && i === 0) return { ...e, promoted: true, promotionTier: firstN };
        for (let n = 2; n <= 5; n++) {
          const key = `first-${n}`;
          if (debugPromos.has(key) && i < n) return { ...e, promoted: true, promotionTier: debugPromos.get(key) };
        }
        return e;
      })
    : rawEvents;

  const { hint, dismiss: dismissHint } = useHints({
    isSupporter,
    eventCount: events.length,
    pinnedCount: pinnedIds.size,
  });

  const handleAddEvent = useCallback((eventData) => {
    addLocalEvent(eventData);
    setRefreshKey((k) => k + 1);
    setShowAddForm(false);
  }, []);

  if (geoLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="text-3xl mb-2">🌱</div>
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm mt-3 font-medium" style={{ color: 'var(--text-faint)' }}>Finding your vibe...</p>
        </div>
      </div>
    );
  }

  const panelProps = {
    events,
    pastEvents,
    city,
    loading: eventsLoading,
    isFallback,
    isSupporter,
    onShowSupporter: () => setShowSupporter(true),
    onBrowseCity: () => isSupporter ? setShowCitySearch(true) : setShowSupporter(true),
    isTeleported,
    onGoHome: goHome,
    onAddEvent: () => setShowAddForm(true),
    onPromoteEvent: setPromoteEvent,
    onAbout: () => setShowAbout(true),
    radius,
    onRadiusChange: setRadius,
    priceFilter,
    onPriceFilterChange: setPriceFilter,
    categories,
    onToggleCategory: (cat) => {
      setCategories((prev) => {
        const next = new Set(prev);
        next.has(cat) ? next.delete(cat) : next.add(cat);
        return next;
      });
    },
    onClearCategories: () => setCategories(new Set()),
    timeFilter,
    onTimeFilterChange: (t) => { setTimeFilter(t); if (t !== 'custom') setDateRange(null); },
    dateRange,
    onDateRangeChange: (r) => { setDateRange(r); setTimeFilter(r ? 'custom' : 'anytime'); },
    onEventHover: isMobile ? null : setHighlightedEvent,
    onEventClick: setSelectedEvent,
    selectedEvent,
    pinnedIds,
    onTogglePin: togglePin,
  };

  return (
    <div className="h-full w-full relative">
      {/* Error toast */}
      {(geoError || eventsError) && (
        <div className="absolute top-4 right-4 z-[1500] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-2 rounded-lg">
          {geoError || eventsError}
        </div>
      )}

      {isMobile ? (
        /* ── MOBILE LAYOUT ── */
        <>
          {/* Map fills the screen */}
          <EventMap
            location={location}
            homeLocation={homeLocation}
            events={events}
            radiusKm={radius}
            highlightedEvent={highlightedEvent}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            panelCollapsed={false}
            onAbout={() => setShowAbout(true)}
            mobile
          />

          {/* Bottom sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 z-[1100] flex flex-col will-change-[height]"
            style={{
              height: sheetExpanded ? '75vh' : 48,
              transition: 'height 0.25s ease-out',
              background: 'var(--panel-bg-solid)',
              borderTop: '1px solid var(--border)',
              borderRadius: '14px 14px 0 0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Drag handle + peek bar */}
            <button
              onClick={() => setSheetExpanded(!sheetExpanded)}
              className="w-full flex flex-col items-center pt-2 pb-1.5 shrink-0 gap-1.5"
            >
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-hover)' }} />
              {!sheetExpanded && (
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-faintest)' }}>
                  {events.length} events nearby — tap to explore
                </span>
              )}
            </button>

            {/* Sheet content */}
            <EventPanel
              {...panelProps}
              mobile
              collapsed={false}
              onToggle={() => setSheetExpanded(!sheetExpanded)}
            />
          </div>
        </>
      ) : (
        /* ── DESKTOP LAYOUT ── */
        <div className="h-full w-full flex">
          <EventPanel
            {...panelProps}
            collapsed={panelCollapsed}
            onToggle={() => setPanelCollapsed(!panelCollapsed)}
          />
          <div className="flex-1 relative min-w-0">
            <EventMap
              location={location}
              homeLocation={homeLocation}
              events={events}
              radiusKm={radius}
              highlightedEvent={highlightedEvent}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
              panelCollapsed={panelCollapsed}
              onAbout={() => setShowAbout(true)}
            />
          </div>
        </div>
      )}

      <HintToast
        hint={hint}
        onDismiss={dismissHint}
        onAction={(action) => {
          if (action === 'support') setShowSupporter(true);
          if (action === 'promote') { /* future: open promote flow */ }
        }}
      />

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {promoteEvent && <PromoteModal event={promoteEvent} onClose={() => setPromoteEvent(null)} />}
      {showSupporter && <SupporterModal onClose={() => setShowSupporter(false)} />}
      {showCitySearch && <CitySearchModal onSelect={teleport} onClose={() => setShowCitySearch(false)} />}

      <DebugPanel
          isSupporter={isSupporter}
          events={events}
          onActivateSupporter={activateSupporter}
          onResetSupporter={resetSupporter}
          onSimulatePromotion={(eventId, tier) => {
            setDebugPromos((prev) => {
              const next = new Map(prev);
              next.set(eventId, tier);
              return next;
            });
          }}
        />
      )}

      {showAddForm && (
        <AddEventForm
          userLocation={location}
          onSubmit={handleAddEvent}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

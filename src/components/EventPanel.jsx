import { useEffect, useRef, useState } from 'react';
import EventCard from './EventCard';
import RadiusSlider from './RadiusSlider';

const CATEGORY_CHIPS = [
  { key: 'Music', label: 'Music', emoji: '🎵', color: '#a78bfa' },
  { key: 'Food', label: 'Food', emoji: '🍜', color: '#fb923c' },
  { key: 'Comedy', label: 'Comedy', emoji: '😂', color: '#fb7185' },
  { key: 'Art', label: 'Art', emoji: '🎨', color: '#f472b6' },
  { key: 'Tech', label: 'Tech', emoji: '💡', color: '#60a5fa' },
  { key: 'Sports', label: 'Sports', emoji: '⚽', color: '#2dd4bf' },
  { key: 'Community', label: 'Community', emoji: '🤝', color: '#38bdf8' },
  { key: 'Fitness', label: 'Fitness', emoji: '🏃', color: '#34d399' },
];

const TIME_CHIPS = [
  { key: 'anytime', label: 'Anytime', emoji: '🕐' },
  { key: 'today', label: 'Today', emoji: '📅' },
  { key: 'tonight', label: 'Tonight', emoji: '🌙' },
  { key: 'tomorrow', label: 'Tomorrow', emoji: '🌅' },
  { key: 'weekend', label: 'Weekend', emoji: '🎉' },
  { key: 'thisweek', label: 'This Week', emoji: '📆' },
];

export default function EventPanel({ events, pastEvents = [], city, loading, isFallback, isSupporter, onShowSupporter, onBrowseCity, isTeleported, onGoHome, radius, onRadiusChange, priceFilter, onPriceFilterChange, categories, onToggleCategory, onClearCategories, timeFilter, onTimeFilterChange, dateRange, onDateRangeChange, onEventHover, onEventClick, selectedEvent, pinnedIds, onTogglePin, onAddEvent, onAbout, onPromoteEvent, collapsed, onToggle, mobile }) {
  const cardRefs = useRef({});
  const [showPast, setShowPast] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Build active filter summary
  const activeFilters = [];
  if (priceFilter === 'free') activeFilters.push({ label: 'Free', emoji: '🆓', key: 'price' });
  if (timeFilter !== 'anytime') {
    const tc = TIME_CHIPS.find((t) => t.key === timeFilter);
    if (tc) activeFilters.push({ label: tc.label, emoji: tc.emoji, key: `time-${tc.key}` });
  }
  if (dateRange?.from) activeFilters.push({ label: dateRange.to && dateRange.to !== dateRange.from ? `${dateRange.from} → ${dateRange.to}` : dateRange.from, emoji: '📅', key: 'daterange' });
  for (const cat of categories) {
    const cc = CATEGORY_CHIPS.find((c) => c.key === cat);
    if (cc) activeFilters.push({ label: cc.label, emoji: cc.emoji, key: `cat-${cat}` });
  }
  const hasActiveFilters = activeFilters.length > 0;

  const clearAllFilters = () => {
    onPriceFilterChange('all');
    onClearCategories();
    onTimeFilterChange('anytime');
    onDateRangeChange(null);
  };

  // Scroll selected card into view — only when panel is visible
  // Scroll to selected card in the panel — delayed to avoid interfering with click interactions
  useEffect(() => {
    if (!selectedEvent || collapsed) return;
    const timer = setTimeout(() => {
      const el = cardRefs.current[selectedEvent.id];
      if (!el || el.offsetParent === null) return;
      // Use the scrollable parent instead of scrollIntoView to avoid layout shifts
      const scrollParent = el.closest('[data-eventlist]');
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offset = elRect.top - parentRect.top - parentRect.height / 2 + elRect.height / 2;
        scrollParent.scrollBy({ top: offset, behavior: 'smooth' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedEvent, collapsed]);

  // Sort pinned events to top
  const q = search.toLowerCase().trim();

  function matchesSearch(e) {
    if (!q) return true;
    return e.name?.toLowerCase().includes(q)
      || e.venue?.toLowerCase().includes(q)
      || e.description?.toLowerCase().includes(q)
      || e.category?.toLowerCase().includes(q);
  }

  const sortedEvents = [...events].filter(matchesSearch).sort((a, b) => {
    // Tier: pinned=0, promoted-spotlight=1, promoted-boost=2, regular=3
    function rank(e) {
      if (pinnedIds.has(e.id)) return 0;
      if (e.promotionTier === 'spotlight') return 1;
      if (e.promotionTier === 'boost') return 2;
      return 3;
    }
    return rank(a) - rank(b);
  });

  const filteredPast = pastEvents.filter(matchesSearch);


  return (
    <div
      className={mobile
        ? 'flex-1 flex flex-col overflow-hidden min-h-0'
        : 'h-full shrink-0 backdrop-blur-xl flex flex-col overflow-hidden transition-[width] duration-300 border-r'
      }
      style={mobile ? {} : { width: collapsed ? 48 : '50vw', maxWidth: collapsed ? 48 : 720, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
    >
        {!mobile && collapsed ? (
          <div className="flex flex-col items-center pt-3 gap-3 w-full h-full" style={{ background: 'var(--panel-bg)' }}>
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm"
              style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}
            >
              ›
            </button>
            <span className="text-[9px] font-bold tracking-[0.2em] [writing-mode:vertical-lr] opacity-60" style={{ color: 'var(--text-faint)' }}>
              TOUCH GRASS
            </span>
            <div className="mt-auto mb-4">
              {isSupporter ? (
                <span className="text-sm" title="Supporter">🌿</span>
              ) : (
                <button
                  onClick={onShowSupporter}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm"
                  style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
                  title="Support Touch Grass"
                >
                  🌿
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`shrink-0 ${mobile ? 'px-4 pt-2 pb-2' : 'px-5 pt-5 pb-3'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                      Touch Grass
                    </span>
                  </h1>
                  <p className="text-[10px] mt-1 font-medium tracking-wide flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                    {sortedEvents.length} things to do{city ? ` in ${city}` : ' nearby'}
                    <button
                      onClick={onBrowseCity}
                      className="text-[9px] px-1.5 py-0.5 rounded-full transition-colors"
                      style={{ background: 'var(--surface-overlay)', color: isSupporter ? '#34d399' : 'var(--text-faintest)' }}
                      title={isSupporter ? 'Browse another city' : 'Supporters can browse other cities'}
                    >
                      🌍
                    </button>
                    {isTeleported && (
                      <button
                        onClick={onGoHome}
                        className="text-[9px] px-2 py-0.5 rounded-full transition-colors"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                        title="Back to my location"
                      >
                        📍 My location
                      </button>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSupporter ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                      🌿 Supporter
                    </span>
                  ) : (
                    <button
                      onClick={onShowSupporter}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors"
                      style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
                    >
                      🌿 Support
                    </button>
                  )}
                  {!mobile && (
                    <button
                      onClick={onToggle}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm"
                      style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}
                      title="Collapse panel"
                    >
                      ‹
                    </button>
                  )}
                </div>
              </div>

              {/* Search + Radius — always visible */}
              <div className="mb-3">
                <RadiusSlider value={radius} onChange={onRadiusChange} />
              </div>

              <div className="relative mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events, venues..."
                  className="w-full text-[11px] pl-7 pr-7 py-1.5 rounded-lg outline-none transition-colors"
                  style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] opacity-40">🔍</span>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-40 hover:opacity-80"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Mobile: collapsible filter toggle */}
              {mobile && (
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="w-full flex items-center justify-between text-[10px] font-medium px-2.5 py-1.5 rounded-lg mb-2 transition-colors"
                  style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🎛</span>
                    Filters
                    {hasActiveFilters && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                        {activeFilters.length}
                      </span>
                    )}
                  </span>
                  <span style={{ transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                </button>
              )}

              {/* Filter chips — always visible on desktop, collapsible on mobile */}
              {(!mobile || filtersExpanded) && (
                <div style={mobile ? { animation: 'filterSlideIn 0.2s ease-out' } : undefined}>
                  {/* Time filter chips */}
                  <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
                    {TIME_CHIPS.map((t) => {
                      const active = timeFilter === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => { onTimeFilterChange(active ? 'anytime' : t.key); setShowDatePicker(false); }}
                          className="shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-all font-medium flex items-center gap-1"
                          style={{
                            background: active ? 'var(--surface-overlay-hover)' : 'var(--surface-overlay)',
                            color: active ? 'var(--text)' : 'var(--text-faintest)',
                            border: `1px solid ${active ? 'var(--border-hover)' : 'transparent'}`,
                          }}
                        >
                          <span className="text-xs">{t.emoji}</span>
                          {t.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-all font-medium flex items-center gap-1"
                      style={{
                        background: dateRange ? 'var(--surface-overlay-hover)' : 'var(--surface-overlay)',
                        color: dateRange ? 'var(--text)' : 'var(--text-faintest)',
                        border: `1px solid ${dateRange ? 'var(--border-hover)' : 'transparent'}`,
                      }}
                    >
                      <span className="text-xs">📅</span>
                      {dateRange ? `${dateRange.from}${dateRange.to && dateRange.to !== dateRange.from ? ` → ${dateRange.to}` : ''}` : 'Dates'}
                    </button>
                  </div>

                  {/* Date range picker dropdown */}
                  {showDatePicker && (
                    <div className="mb-2 p-2.5 rounded-xl flex items-center gap-2 flex-wrap" style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}>
                      <input
                        type="date"
                        value={dateRange?.from || ''}
                        onChange={(e) => onDateRangeChange(e.target.value ? { from: e.target.value, to: dateRange?.to || '' } : null)}
                        className="text-[11px] rounded-lg px-2 py-1 appearance-none"
                        style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        min={new Date().toISOString().slice(0, 10)}
                      />
                      <span className="text-[10px]" style={{ color: 'var(--text-faintest)' }}>to</span>
                      <input
                        type="date"
                        value={dateRange?.to || ''}
                        onChange={(e) => onDateRangeChange({ from: dateRange?.from || new Date().toISOString().slice(0, 10), to: e.target.value })}
                        className="text-[11px] rounded-lg px-2 py-1 appearance-none"
                        style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        min={dateRange?.from || new Date().toISOString().slice(0, 10)}
                      />
                      {dateRange && (
                        <button
                          onClick={() => { onDateRangeChange(null); setShowDatePicker(false); }}
                          className="text-[10px] px-2 py-1 rounded-lg font-medium"
                          style={{ background: 'var(--surface-overlay-hover)', color: 'var(--text-faint)' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}

                  {/* Price + Category filters */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide flex-wrap">
                    <button
                      onClick={() => onPriceFilterChange(priceFilter === 'free' ? 'all' : 'free')}
                      className="shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-all font-medium flex items-center gap-1"
                      style={{
                        background: priceFilter === 'free' ? 'rgba(52,211,153,0.2)' : 'var(--surface-overlay)',
                        color: priceFilter === 'free' ? '#34d399' : 'var(--text-faintest)',
                        border: `1px solid ${priceFilter === 'free' ? 'rgba(52,211,153,0.35)' : 'transparent'}`,
                      }}
                    >
                      <span className="text-xs">🆓</span>Free
                    </button>

                    {CATEGORY_CHIPS.map((chip) => {
                      const active = categories.has(chip.key);
                      return (
                        <button
                          key={chip.key}
                          onClick={() => onToggleCategory(chip.key)}
                          className="shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-all font-medium flex items-center gap-1"
                          style={{
                            background: active ? `${chip.color}25` : 'var(--surface-overlay)',
                            color: active ? chip.color : 'var(--text-faintest)',
                            border: `1px solid ${active ? `${chip.color}40` : 'transparent'}`,
                          }}
                        >
                          <span className="text-xs">{chip.emoji}</span>
                          {chip.label}
                        </button>
                      );
                    })}

                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="shrink-0 text-[10px] px-2 py-1 rounded-full font-medium transition-colors"
                        style={{ background: 'var(--surface-overlay)', color: 'var(--text-faintest)' }}
                      >
                        ✕ Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-px mx-4" style={{ background: 'var(--border)' }} />

            <div className="flex-1 overflow-y-auto px-3 py-3" data-eventlist>
              {isFallback && !loading && (
                <div className="mb-3 px-3 py-2 rounded-lg text-[10px] font-medium text-center" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                  Demo mode — showing sample events. Live data temporarily unavailable.
                </div>
              )}
              {loading ? (
                <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--surface-overlay)' }} />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-3xl mb-3">🌾</div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>Nothing nearby</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faintest)' }}>Try expanding the radius slider, changing filters, or searching a nearby city</p>
                </div>
              ) : (
                <>
                  {/* Promoted events — sticky at top */}
                  {sortedEvents.some((e) => e.promoted) && (
                    <div
                      className="sticky top-0 z-10 pb-2 -mx-3 px-3 pt-1"
                      style={{ background: 'var(--panel-bg-solid)' }}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#fbbf24' }}>
                        <span>⭐</span> Promoted
                      </div>
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        {sortedEvents.filter((e) => e.promoted).map((event) => (
                          <EventCard
                            key={event.id}
                            ref={(el) => { cardRefs.current[event.id] = el; }}
                            event={event}
                            selected={selectedEvent?.id === event.id}
                            pinned={pinnedIds.has(event.id)}
                            onTogglePin={onTogglePin}
                            onHover={onEventHover}
                            onClick={onEventClick}
                            onPromote={onPromoteEvent}
                          />
                        ))}
                      </div>
                      <div className="h-px mt-2" style={{ background: 'var(--border)' }} />
                    </div>
                  )}

                  {/* Regular events */}
                  <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
                    {sortedEvents.filter((e) => !e.promoted).map((event) => (
                      <EventCard
                        key={event.id}
                        ref={(el) => { cardRefs.current[event.id] = el; }}
                        event={event}
                        selected={selectedEvent?.id === event.id}
                        pinned={pinnedIds.has(event.id)}
                        onTogglePin={onTogglePin}
                        onHover={onEventHover}
                        onClick={onEventClick}
                        onPromote={onPromoteEvent}
                      />
                    ))}
                  </div>

                  {filteredPast.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowPast(!showPast)}
                        className="w-full flex items-center gap-2 py-2 px-1 text-[11px] font-medium rounded-lg transition-colors"
                        style={{ color: 'var(--text-faintest)' }}
                      >
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        <span className="shrink-0">
                          {showPast ? '▾' : '▸'} {filteredPast.length} past event{filteredPast.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                      </button>

                      {showPast && (
                        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 mt-2 opacity-50">
                          {filteredPast.map((event) => (
                            <EventCard
                              key={event.id}
                              ref={(el) => { cardRefs.current[event.id] = el; }}
                              event={event}
                              selected={selectedEvent?.id === event.id}
                              pinned={pinnedIds.has(event.id)}
                              onTogglePin={onTogglePin}
                              onHover={onEventHover}
                              onClick={onEventClick}
                              onPromote={onPromoteEvent}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Disclaimer */}
                  <div className="mt-6 mb-2 px-2 py-3 rounded-xl text-center" style={{ background: 'var(--surface-overlay)' }}>
                    <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-faintest)' }}>
                      Don't see your event? We're working on a way for organizers to submit events directly. Stay tuned!
                    </p>
                    <p className="text-[9px] mt-1" style={{ color: 'var(--text-faintest)', opacity: 0.6 }}>
                      <a href="mailto:info@touch-grass.fyi" className="underline">info@touch-grass.fyi</a>
                    </p>
                  </div>
                </>
              )}
            </div>

          </>
        )}
    </div>
  );
}

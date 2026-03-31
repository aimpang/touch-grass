import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../hooks/useTheme.jsx';
import MapInfoCard from './MapInfoCard';

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Muted, dark-friendly palette — lower saturation, sits on dark tiles
const CAT = {
  Music:     '#a78bfa',
  Food:      '#fb923c',
  Market:    '#22d3ee',
  Fitness:   '#34d399',
  Comedy:    '#fb7185',
  Art:       '#f472b6',
  Tech:      '#60a5fa',
  Sports:    '#2dd4bf',
  Film:      '#c084fc',
  Dance:     '#e879f9',
  Community: '#38bdf8',
};
const DEFAULT_COLOR = '#94a3b8';

// Stroke-based icons — all 24x24 viewBox, Lucide/Feather style, centered
const CAT_SVG = {
  Music:     '<path d="M9 18V5l12-2v13" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="none" stroke="FG" stroke-width="2"/><circle cx="18" cy="16" r="3" fill="none" stroke="FG" stroke-width="2"/>',
  Food:      '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6h4m1 0v9" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  Market:    '<path d="M6 2L3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5H6zM3 7h18M16 11a4 4 0 0 1-8 0" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  Fitness:   '<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  Comedy:    '<circle cx="12" cy="12" r="10" fill="none" stroke="FG" stroke-width="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="FG" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="FG" stroke-width="3" stroke-linecap="round"/>',
  Art:       '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.24-.3-.39-.65-.39-1.04 0-.83.67-1.5 1.5-1.5H16a6 6 0 0 0 6-6c0-5.52-4.48-10-10-10z" fill="none" stroke="FG" stroke-width="2"/><circle cx="7.5" cy="11.5" r="1.5" fill="FG"/><circle cx="12" cy="7.5" r="1.5" fill="FG"/><circle cx="16.5" cy="11.5" r="1.5" fill="FG"/>',
  Tech:      '<rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="none" stroke="FG" stroke-width="2"/><line x1="8" y1="21" x2="16" y2="21" stroke="FG" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="FG" stroke-width="2" stroke-linecap="round"/>',
  Sports:    '<circle cx="12" cy="12" r="10" fill="none" stroke="FG" stroke-width="2"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10M12 2a15 15 0 0 0-4 10 15 15 0 0 0 4 10M2 12h20" fill="none" stroke="FG" stroke-width="2"/>',
  Film:      '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" fill="none" stroke="FG" stroke-width="2"/><line x1="7" y1="2" x2="7" y2="22" stroke="FG" stroke-width="2"/><line x1="17" y1="2" x2="17" y2="22" stroke="FG" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="FG" stroke-width="2"/><line x1="2" y1="7" x2="7" y2="7" stroke="FG" stroke-width="2"/><line x1="2" y1="17" x2="7" y2="17" stroke="FG" stroke-width="2"/><line x1="17" y1="7" x2="22" y2="7" stroke="FG" stroke-width="2"/><line x1="17" y1="17" x2="22" y2="17" stroke="FG" stroke-width="2"/>',
  Dance:     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" fill="none" stroke="FG" stroke-width="2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  Community: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" fill="none" stroke="FG" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};

const iconCache = {};

function buildMarkerIcon(category, state) {
  const key = `${category}-${state}`;
  if (iconCache[key]) return iconCache[key];

  const color = CAT[category] || DEFAULT_COLOR;
  const isHighlighted = state === 'highlighted';
  const isSelected = state === 'selected';
  const isPromoted = state === 'promoted';
  const isActive = isHighlighted || isSelected || isPromoted;

  // Sizes
  const dot = isActive ? 36 : 28;
  const half = dot / 2;
  const svgIcon = (CAT_SVG[category] || '<circle cx="12" cy="12" r="4" fill="none" stroke="FG" stroke-width="2"/>').replace(/FG/g, color);
  const iconSz = isActive ? 18 : 14;

  const html = `
    <div style="
      position: relative;
      width: ${dot}px; height: ${dot}px;
    ">
      ${isSelected ? `<div style="
        position: absolute; inset: -6px; border-radius: 50%;
        background: ${color};
        opacity: 0.15;
        animation: markerPing 1.8s cubic-bezier(0,0,0.2,1) infinite;
      "></div>` : ''}
      ${isActive ? `<div style="
        position: absolute; inset: -3px; border-radius: 50%;
        background: ${color}; opacity: 0.10;
      "></div>` : ''}
      <div style="
        width: ${dot}px; height: ${dot}px; border-radius: 50%;
        background: rgba(18, 18, 28, ${isActive ? '0.92' : '0.8'});
        border: ${isPromoted ? '2px solid #fbbf24' : `1.5px solid ${color}${isActive ? '99' : '55'}`};
        ${isActive ? `box-shadow: ${isPromoted ? '0 0 16px rgba(251,191,36,0.35)' : `0 0 16px ${color}40`};` : ''}
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="${iconSz}" height="${iconSz}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
          ${svgIcon}
        </svg>
      </div>
    </div>`;

  const icon = L.divIcon({
    className: '',
    html,
    iconSize: [dot, dot],
    iconAnchor: [half, half],
  });

  iconCache[key] = icon;
  return icon;
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative; width:16px; height:16px;">
    <div style="
      position:absolute; inset:-6px; border-radius:50%;
      background:rgba(96,165,250,0.2);
      animation: userPulse 2s ease-in-out infinite;
    "></div>
    <div style="
      width:16px; height:16px; border-radius:50%;
      background: #3b82f6;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 0 12px rgba(59,130,246,0.4);
      position:relative;
    "></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FlyToHandler({ center, selectedEvent, lastSelectTime, mobile }) {
  const map = useMap();
  const prevZoom = useRef(map.getZoom());
  const prevSelectedId = useRef(null);
  const prevCenter = useRef(center);

  useEffect(() => {
    const newId = selectedEvent?.id || null;
    const oldId = prevSelectedId.current;
    if (newId === oldId) return;

    if (newId) {
      if (!oldId) prevZoom.current = map.getZoom();
      lastSelectTime.current = Date.now();
      const target = [selectedEvent.lat, selectedEvent.lng];
      const zoom = oldId ? Math.max(map.getZoom(), 14) : 16;

      if (mobile) {
        // On mobile, offset the blob to the left so the info card has room on the right
        const targetPoint = map.project(target, zoom);
        const mapW = map.getSize().x;
        // Place blob at ~30% from left edge
        const offsetX = mapW * 0.2;
        const offsetCenter = map.unproject(targetPoint.add([offsetX, 0]), zoom);
        map.setView(offsetCenter, zoom, { animate: true, duration: oldId ? 0.8 : 1 });
      } else if (oldId) {
        map.setView(target, zoom, { animate: true, duration: 0.8 });
      } else {
        map.flyTo(target, zoom, { duration: 1 });
      }
    } else if (oldId) {
      // Stay at current zoom — don't snap back
    }

    prevSelectedId.current = newId;
  }, [selectedEvent, map, lastSelectTime, mobile]);

  // Fly to new center when location changes (teleport / go home)
  useEffect(() => {
    if (!center) return;
    if (prevCenter.current && (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1])) {
      if (!selectedEvent) {
        map.flyTo(center, 13, { duration: 1 });
      }
    }
    prevCenter.current = center;
  }, [center, map, selectedEvent]);

  return null;
}

function MapClickHandler({ onSelectEvent, lastSelectTime }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => {
      // Don't deselect if click originated inside the info card
      if (e.originalEvent?.target?.closest?.('[data-infocard]')) return;
      // Don't deselect if a selection just happened (prevents scroll-triggered false clicks)
      if (lastSelectTime.current && Date.now() - lastSelectTime.current < 500) return;
      onSelectEvent?.(null);
    };
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onSelectEvent]);
  return null;
}

function MapResizer({ panelCollapsed }) {
  const map = useMap();
  useEffect(() => {
    // Wait for the CSS transition to finish, then invalidate
    const timer = setTimeout(() => map.invalidateSize({ animate: true }), 320);
    return () => clearTimeout(timer);
  }, [panelCollapsed, map]);
  return null;
}

function AboutButton({ onAbout, mobile }) {
  const map = useMap();
  const container = map.getContainer();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  return createPortal(
    <button
      onClick={onAbout}
      title="About Touch Grass"
      aria-label="About Touch Grass"
      style={{
        position: 'absolute', bottom: mobile ? 60 : 12, right: 12, zIndex: 1000,
        width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: isDark ? 'rgba(18,18,28,0.85)' : 'rgba(255,255,255,0.9)',
        color: isDark ? '#8888aa' : '#666',
        fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      ℹ️
    </button>,
    container
  );
}

function MapControls({ userCenter, homeCenter }) {
  const map = useMap();
  const container = map.getContainer();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const btnStyle = {
    ...zoomBtnStyle,
    background: isDark ? 'rgba(18,18,28,0.85)' : 'rgba(255,255,255,0.9)',
    color: isDark ? '#8888aa' : '#666',
  };

  return createPortal(
    <div
      style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 6,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
        <button onClick={() => map.zoomIn()} style={btnStyle} aria-label="Zoom in">+</button>
        <button onClick={() => map.zoomOut()} style={btnStyle} aria-label="Zoom out">−</button>
      </div>
      <button
        onClick={() => map.flyTo(homeCenter || userCenter, 16, { duration: 1 })}
        title="Snap to my location"
        aria-label="Snap to my location"
        style={{
          ...btnStyle,
          borderRadius: 10, borderBottom: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          ...btnStyle,
          borderRadius: 10, borderBottom: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          fontSize: 15,
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>,
    container
  );
}

const zoomBtnStyle = {
  width: 36, height: 36, border: 'none', cursor: 'pointer',
  background: 'rgba(18,18,28,0.85)', color: '#8888aa',
  fontSize: 18, fontWeight: 300, lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  transition: 'color 0.15s, background 0.15s',
};

const TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
};

// Only renders markers within the current viewport + a buffer
const VisibleMarkers = React.memo(function VisibleMarkers({ events, highlightedEvent, selectedEvent, onSelectEvent }) {
  const map = useMap();
  const [bounds, setBounds] = React.useState(null);
  const handlersRef = useRef({});

  useEffect(() => {
    function update() { setBounds(map.getBounds().pad(0.3)); }
    update();
    map.on('moveend zoomend', update);
    return () => map.off('moveend zoomend', update);
  }, [map]);

  if (!bounds) return null;

  return events.map((event) => {
    if (!bounds.contains([event.lat, event.lng])) return null;

    const isSelected = selectedEvent?.id === event.id;
    const isHighlighted = highlightedEvent?.id === event.id;
    const isSpotlight = event.promotionTier === 'spotlight';
    const state = isSelected ? 'selected' : isHighlighted ? 'highlighted' : isSpotlight ? 'promoted' : 'default';

    // Stable event handler reference per event id
    if (!handlersRef.current[event.id]) {
      handlersRef.current[event.id] = { click: () => onSelectEvent?.(event) };
    }

    return (
      <Marker
        key={event.id}
        position={[event.lat, event.lng]}
        icon={buildMarkerIcon(event.category, state)}
        zIndexOffset={isSelected ? 2000 : isHighlighted ? 1000 : isSpotlight ? 500 : 0}
        eventHandlers={handlersRef.current[event.id]}
      />
    );
  });
});



const circlePathOptions = {
  color: '#3b82f6',
  fillColor: '#3b82f6',
  fillOpacity: 0.04,
  weight: 1,
  opacity: 0.3,
};

// Hide info card during active zoom to avoid expensive repositioning
function ZoomAwareInfoCard({ selectedEvent, onSelectEvent }) {
  const map = useMap();
  const [zooming, setZooming] = React.useState(false);

  useEffect(() => {
    const onStart = () => setZooming(true);
    const onEnd = () => setZooming(false);
    map.on('zoomstart', onStart);
    map.on('zoomend', onEnd);
    return () => { map.off('zoomstart', onStart); map.off('zoomend', onEnd); };
  }, [map]);

  if (!selectedEvent || zooming) return null;
  return <MapInfoCard event={selectedEvent} onClose={() => onSelectEvent?.(null)} />;
}

export default function EventMap({ location, homeLocation: homeLoc, events, radiusKm, highlightedEvent, selectedEvent, onSelectEvent, panelCollapsed, onAbout, mobile }) {
  const lastSelectTimeRef = useRef(0);
  const { theme } = useTheme();
  if (!location) return null;

  const center = useMemo(() => [location.lat, location.lng], [location.lat, location.lng]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
      preferCanvas={true}
      markerZoomAnimation={false}
    >
      <TileLayer
        key={theme}
        url={TILES[theme]}
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        updateWhenZooming={false}
        updateWhenIdle={true}
        keepBuffer={4}
      />

      <FlyToHandler
        center={center}
        selectedEvent={selectedEvent}
        lastSelectTime={lastSelectTimeRef}
        mobile={mobile}
      />

      <MapResizer panelCollapsed={panelCollapsed} />
      <MapControls userCenter={center} homeCenter={homeLoc ? [homeLoc.lat, homeLoc.lng] : null} />
      <AboutButton onAbout={onAbout} mobile={mobile} />
      <MapClickHandler onSelectEvent={onSelectEvent} lastSelectTime={lastSelectTimeRef} />

      {/* User location */}
      <Marker position={center} icon={userIcon} zIndexOffset={2000} />

      {/* Radius circle */}
      <Circle
        center={center}
        radius={radiusKm * 1000}
        pathOptions={circlePathOptions}
      />

      {/* Event markers — viewport-culled for performance */}
      <VisibleMarkers
        events={events}
        highlightedEvent={highlightedEvent}
        selectedEvent={selectedEvent}
        onSelectEvent={onSelectEvent}
      />

      <ZoomAwareInfoCard selectedEvent={selectedEvent} onSelectEvent={onSelectEvent} />
    </MapContainer>
  );
}

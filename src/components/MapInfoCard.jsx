import { useMap } from 'react-leaflet';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { getEventStatus } from '../utils/eventStatus';

const CATEGORY_COLORS = {
  Music:     { bg: '#8b5cf6', light: '#c4b5fd' },
  Food:      { bg: '#f97316', light: '#fdba74' },
  Market:    { bg: '#06b6d4', light: '#67e8f9' },
  Fitness:   { bg: '#10b981', light: '#6ee7b7' },
  Comedy:    { bg: '#f43f5e', light: '#fda4af' },
  Art:       { bg: '#ec4899', light: '#f9a8d4' },
  Tech:      { bg: '#3b82f6', light: '#93c5fd' },
  Sports:    { bg: '#14b8a6', light: '#5eead4' },
  Film:      { bg: '#a855f7', light: '#d8b4fe' },
  Dance:     { bg: '#d946ef', light: '#f0abfc' },
  Community: { bg: '#0ea5e9', light: '#7dd3fc' },
};

const CARD_W_DESKTOP = 280;
const CARD_W_MOBILE = 220;
const CARD_GAP = 32;

export default function MapInfoCard({ event, onClose }) {
  const map = useMap();
  const [pos, setPos] = useState(null);
  const [side, setSide] = useState('right');
  const cardRef = useRef(null);
  const eventIdRef = useRef(null);
  const [animKey, setAnimKey] = useState(0);

  // Trigger re-entrance animation when event changes
  useEffect(() => {
    if (event && event.id !== eventIdRef.current) {
      eventIdRef.current = event.id;
      setAnimKey((k) => k + 1);
    }
  }, [event]);

  useEffect(() => {
    if (!event) return;

    function update() {
      const pt = map.latLngToContainerPoint([event.lat, event.lng]);
      const mapSize = map.getSize();
      const cardW = mapSize.x < 600 ? CARD_W_MOBILE : CARD_W_DESKTOP;

      // If the blob is off screen, dismiss
      if (pt.x < -50 || pt.x > mapSize.x + 50 || pt.y < -50 || pt.y > mapSize.y + 50) {
        onClose();
        return;
      }

      // Decide which side the card goes on
      const spaceRight = mapSize.x - pt.x;
      const spaceLeft = pt.x;
      const newSide = spaceRight > cardW + CARD_GAP + 20 ? 'right'
        : spaceLeft > cardW + CARD_GAP + 20 ? 'left'
        : 'right';

      setSide(newSide);
      setPos({ x: pt.x, y: pt.y, cardW });
    }

    update();

    map.on('move zoom moveend zoomend', update);
    return () => {
      map.off('move zoom moveend zoomend', update);
    };
  }, [map, event, onClose]);

  const container = map.getContainer();

  if (!event || !pos) return null;

  const cat = CATEGORY_COLORS[event.category] || { bg: '#6b7280', light: '#d1d5db' };

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const timeStr = new Date(event.date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const cardW = pos.cardW || CARD_W_DESKTOP;

  const cardStyle = {
    position: 'absolute',
    top: pos.y,
    width: cardW,
    transform: `translateY(-50%)`,
    zIndex: 1100,
    pointerEvents: 'auto',
    ...(side === 'right'
      ? { left: pos.x + CARD_GAP }
      : { left: pos.x - CARD_GAP - cardW }
    ),
  };

  const animClass = side === 'right' ? 'info-card-pull-right' : 'info-card-pull-left';

  return createPortal(
    <div
      key={animKey}
      ref={cardRef}
      className={animClass}
      style={cardStyle}
      data-infocard="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Chat bubble arrow pointing at blob */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          [side === 'right' ? 'left' : 'right']: -8,
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
          [side === 'right' ? 'borderRight' : 'borderLeft']: `10px solid var(--infocard-bg)`,
          filter: `drop-shadow(${side === 'right' ? '-2px' : '2px'} 0 3px rgba(0,0,0,0.3))`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Arrow border overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          [side === 'right' ? 'left' : 'right']: -9,
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '11px solid transparent',
          borderBottom: '11px solid transparent',
          [side === 'right' ? 'borderRight' : 'borderLeft']: `11px solid ${cat.bg}30`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: 'var(--infocard-bg)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${cat.bg}30`,
          borderRadius: 14,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${cat.bg}15`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${cat.bg}, ${cat.light})` }} />

        {/* Header */}
        <div style={{ padding: '12px 14px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{event.name}</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                {(() => {
                  const status = getEventStatus(event);
                  return status ? (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                      background: status.bgColor, color: status.color,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {status.key === 'live' && (
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%', background: status.color,
                          display: 'inline-block', animation: 'markerPing 1.5s ease-in-out infinite',
                        }} />
                      )}
                      {status.label}
                    </span>
                  ) : null;
                })()}
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                  background: `${cat.bg}20`, color: cat.light,
                }}>
                  {event.category}
                </span>
                {event.saleStatus === 'soldout' ? (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                    Sold Out
                  </span>
                ) : event.saleStatus === 'rescheduled' ? (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>
                    Rescheduled
                  </span>
                ) : (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: event.free ? 'rgba(34,197,94,0.15)' : event.price ? 'rgba(245,158,11,0.15)' : 'rgba(115,115,115,0.15)',
                    color: event.free ? '#4ade80' : event.price ? '#fbbf24' : '#a3a3a3',
                  }}>
                    {event.free ? 'Free' : event.price ? `From $${event.price}` : 'Paid'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 22, height: 22, borderRadius: 6, border: 'none',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-faintest)',
                cursor: 'pointer', fontSize: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.target.style.color = '#666'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.5 }}>{event.description}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
            <InfoRow icon="location" color={cat.bg}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{event.venue}</span>
              {event.address && <span style={{ fontSize: 9, color: 'var(--text-faintest)', display: 'block', marginTop: 1 }}>{event.address}</span>}
            </InfoRow>
            <InfoRow icon="calendar" color={cat.bg}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dateStr} · {timeStr}</span>
            </InfoRow>
            {event.phone && (
              <InfoRow icon="phone" color={cat.bg}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{event.phone}</span>
              </InfoRow>
            )}
            {event.distance != null && (
              <InfoRow icon="distance" color={cat.bg}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{event.distance.toFixed(1)} km away</span>
              </InfoRow>
            )}
            {!event.url || event.source !== 'ticketmaster' ? (
              <InfoRow icon="link" color={cat.bg}>
                {event.url ? (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 10, color: cat.bg, fontWeight: 500, textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                  >
                    Event page ↗
                  </a>
                ) : (
                  <div>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${event.name} ${event.venue || ''} ${dateStr}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: cat.bg, fontWeight: 500, textDecoration: 'none' }}
                      onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                    >
                      Search for this event ↗
                    </a>
                    <div style={{ fontSize: 9, color: 'var(--text-faintest)', marginTop: 2 }}>
                      No direct link available — try the venue or organizer
                    </div>
                  </div>
                )}
              </InfoRow>
            ) : null}
          </div>

          {/* Ticketmaster CTA button */}
          {event.source === 'ticketmaster' && event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                margin: '4px 14px 12px', padding: '9px 16px',
                borderRadius: 99, textDecoration: 'none',
                background: `${cat.bg}20`, color: cat.bg,
                fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${cat.bg}35`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${cat.bg}35`; e.currentTarget.style.borderColor = `${cat.bg}50`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${cat.bg}20`; e.currentTarget.style.borderColor = `${cat.bg}35`; }}
            >
              🎟️ Get Tickets <span style={{ fontSize: 13 }}>→</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    container
  );
}

function InfoRow({ icon, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        background: `${color}12`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <IconSvg name={icon} color="#777" />
      </div>
      <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>{children}</div>
    </div>
  );
}

function IconSvg({ name, color }) {
  const props = { width: 10, height: 10, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'location':
      return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'phone':
      return <svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.88.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.93.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'distance':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
    case 'link':
      return <svg {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
    default:
      return null;
  }
}

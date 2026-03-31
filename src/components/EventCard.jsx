import { forwardRef } from 'react';
import { getEventStatus } from '../utils/eventStatus';

const CAT_STYLE = {
  Music:     { color: '#a78bfa', emoji: '🎵' },
  Food:      { color: '#fb923c', emoji: '🍜' },
  Market:    { color: '#22d3ee', emoji: '🛍️' },
  Fitness:   { color: '#34d399', emoji: '🏃' },
  Comedy:    { color: '#fb7185', emoji: '😂' },
  Art:       { color: '#f472b6', emoji: '🎨' },
  Tech:      { color: '#60a5fa', emoji: '💡' },
  Sports:    { color: '#2dd4bf', emoji: '⚽' },
  Film:      { color: '#c084fc', emoji: '🎬' },
  Dance:     { color: '#e879f9', emoji: '💃' },
  Community: { color: '#38bdf8', emoji: '🤝' },
};

const DEFAULT_STYLE = { color: '#94a3b8', emoji: '📌' };

export default forwardRef(function EventCard({ event, selected, pinned, onTogglePin, onHover, onClick, onPromote }, ref) {
  const timeStr = new Date(event.date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dayStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const status = getEventStatus(event);
  const isLive = status?.key === 'live';
  const isSoon = status?.key === 'soon';
  const isNearby = status?.key === 'nearby';
  const isEnded = status?.key === 'ended';
  const isGlowing = isSoon || isLive;
  const isPromoted = event.promoted;
  const isSpotlight = event.promotionTier === 'spotlight';
  const cat = CAT_STYLE[event.category] || DEFAULT_STYLE;

  const baseBorder = isSpotlight ? '#fbbf2460' : isPromoted ? '#fbbf2430' : isLive ? `${cat.color}50` : isSoon ? `${cat.color}45` : `${cat.color}30`;

  return (
    <div
      ref={ref}
      className={`event-card relative rounded-2xl cursor-pointer group ${isSpotlight ? 'event-card-spotlight' : isPromoted ? 'event-card-boost' : isGlowing ? 'event-card-glow' : ''} ${selected ? 'event-card-inspect' : ''}`}
      style={{
        background: `linear-gradient(145deg, ${cat.color}${isSoon ? '12' : '0a'} 0%, var(--card-bg) 100%)`,
        border: `1px solid ${selected ? `${cat.color}70` : baseBorder}`,
        opacity: isEnded ? 0.5 : 1,
        '--glow-base': `0 0 12px ${cat.color}15, 0 0 0 1px ${cat.color}20`,
        '--glow-peak': `0 0 24px ${cat.color}30, 0 0 0 1px ${cat.color}40`,
        '--inspect-color': cat.color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}18, inset 0 1px 0 ${cat.color}15`;
        e.currentTarget.style.borderColor = `${cat.color}55`;
        onHover?.(event);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = baseBorder;
        onHover?.(null);
      }}
      onClick={() => onClick?.(event)}
    >
      {/* Top accent bar */}
      {isSpotlight ? (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, #f59e0b, #fbbf24, transparent)' }} />
      ) : isPromoted ? (
        <div className="absolute top-0 left-4 right-4 h-[1.5px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)' }} />
      ) : isLive ? (
        <div className="absolute top-0 left-3 right-3 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${cat.color}80, transparent)` }} />
      ) : null}

      <div className="p-3.5">
        {/* Category emoji + status row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{cat.emoji}</span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: `${cat.color}cc` }}
            >
              {event.category}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isPromoted && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                {isSpotlight ? '⭐ Promoted' : 'Promoted'}
              </span>
            )}
            {status && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: status.bgColor, color: status.color }}
            >
              {isLive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: status.color }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: status.color }} />
                </span>
              )}
              {status.label}
            </span>
          )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-bold leading-snug line-clamp-2 mb-1" style={{ color: 'var(--text)' }}>
          {event.name}
        </h3>

        {/* Venue with subtle icon */}
        <p className="text-[11px] truncate mb-2.5" style={{ color: 'var(--text-faint)' }}>
          📍 {event.venue}
        </p>

        {/* Bottom bar */}
        <div className="flex items-center pt-2 border-t gap-1.5" style={{ borderColor: `${cat.color}0a` }}>
          <span className="text-[10px] font-medium truncate" style={{ color: 'var(--text-faint)' }}>
            {dayStr} · {timeStr}
          </span>
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin?.(event.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all ${
                pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'
              }`}
              style={{
                background: pinned ? `${cat.color}20` : 'transparent',
              }}
              title={pinned ? 'Unpin' : 'Pin to top'}
            >
              📌
            </button>
            {!isPromoted && (
              <button
                onClick={(e) => { e.stopPropagation(); onPromote?.(event); }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all opacity-0 group-hover:opacity-50 hover:!opacity-100"
                title="Promote this event"
              >
                🚀
              </button>
            )}
            {event.saleStatus === 'soldout' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/[0.12] text-red-400">
                Sold Out
              </span>
            ) : event.saleStatus === 'rescheduled' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/[0.12] text-orange-400">
                Rescheduled
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  event.free
                    ? 'bg-emerald-500/[0.12] text-emerald-400'
                    : event.price
                      ? 'bg-amber-500/[0.12] text-amber-400'
                      : 'bg-neutral-500/[0.12] text-neutral-400'
                }`}
              >
                {event.free ? 'Free' : event.price ? `From $${event.price}` : 'Paid'}
              </span>
            )}
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-faintest)' }}>{event.distance.toFixed(1)}km</span>
          </div>
        </div>
      </div>
    </div>
  );
});

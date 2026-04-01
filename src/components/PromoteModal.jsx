import { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

const TIERS = [
  {
    key: 'boost',
    name: 'Boost',
    price: '$149 CAD',
    duration: '7 days',
    features: ['Sorted above regular events', '"Promoted" badge on card', 'Bypass all user filters'],
  },
  {
    key: 'spotlight',
    name: 'Spotlight',
    price: '$249 CAD',
    duration: '14 days',
    features: ['Everything in Boost', 'Golden glow animation', 'Highlighted map marker', 'Priority placement', 'Double the exposure time'],
  },
];

export default function PromoteModal({ event, onClose }) {
  const [selectedTier, setSelectedTier] = useState('spotlight');
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useModalA11y(onClose);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventName: event.name,
          tier: selectedTier,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener');
        setOpened(true);
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Promote event"
        className="w-[420px] max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--panel-bg-solid)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Promote Event</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xs min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
            style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}
          >
            ✕
          </button>
        </div>

        {/* Event preview */}
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{event.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{event.venue}</p>
        </div>

        {/* Tier selection */}
        <div className="space-y-3 mb-5">
          {TIERS.map((tier) => (
            <button
              key={tier.key}
              onClick={() => setSelectedTier(tier.key)}
              className="w-full text-left p-4 rounded-xl transition-all"
              style={{
                background: selectedTier === tier.key ? 'rgba(251,191,36,0.08)' : 'var(--surface-overlay)',
                border: `2px solid ${selectedTier === tier.key ? '#fbbf24' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{tier.key === 'spotlight' ? '⭐' : '🚀'}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{tier.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{tier.price}</span>
                  <span className="text-[11px] ml-1" style={{ color: 'var(--text-faintest)' }}>/ {tier.duration}</span>
                </div>
              </div>
              <ul className="space-y-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
                    <span style={{ color: '#fbbf24' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-[11px] text-red-400 mb-3 text-center">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-black transition-colors"
          style={{
            background: loading ? '#a08520' : '#fbbf24',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Opening Stripe...' : opened ? 'Complete payment in Stripe tab' : `Pay ${TIERS.find((t) => t.key === selectedTier)?.price} — Promote`}
        </button>

        <p className="text-[10px] text-center mt-3" style={{ color: 'var(--text-faintest)' }}>
          Secure payment via Stripe. Your event will be promoted immediately after payment.
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

export default function SupporterModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useModalA11y(onClose);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout');
      }
    } catch {
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
        aria-label="Support Touch Grass"
        className="w-[380px] rounded-2xl p-6 text-center"
        style={{ background: 'var(--panel-bg-solid)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">🌿</div>
        <h2 className="text-base font-extrabold mb-1" style={{ color: 'var(--text)' }}>
          Support Touch Grass
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-faint)' }}>
          One-time. No subscription. Just good vibes.
        </p>

        <div className="rounded-xl p-4 mb-5 text-left" style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Supporter</span>
            <span className="text-lg font-extrabold" style={{ color: '#34d399' }}>$24.99 <span className="text-[11px] font-normal" style={{ color: 'var(--text-faintest)' }}>CAD</span></span>
          </div>
          <ul className="space-y-2">
            {[
              ['📌', 'Unlimited event pinning'],
              ['🌍', 'Browse events in any city'],
              ['🌿', 'Supporter badge on your profile'],
              ['💚', 'Help keep Touch Grass free for everyone'],
            ].map(([emoji, text]) => (
              <li key={text} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>{emoji}</span> {text}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-[11px] text-red-400 mb-3">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-colors"
          style={{ background: loading ? '#1a8a5e' : '#34d399', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Redirecting to Stripe...' : 'Support for $24.99 CAD'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-[11px] font-medium"
          style={{ color: 'var(--text-faintest)' }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

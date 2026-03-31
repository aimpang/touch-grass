import { useState, useEffect } from 'react';

export default function DebugPanel({ isSupporter, onActivateSupporter, onSimulatePromotion, onResetSupporter, events }) {
  const [open, setOpen] = useState(false);
  const [promoEventId, setPromoEventId] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const [promoTier, setPromoTier] = useState('spotlight');

  // Secret toggle: type "tgadmin" anywhere to open
  const [seq, setSeq] = useState('');
  useEffect(() => {
    function handler(e) {
      const next = (seq + e.key).slice(-7);
      setSeq(next);
      if (next === 'tgadmin') {
        setOpen((o) => !o);
        setSeq('');
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [seq]);

  if (!open) return null;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const bg = isDark ? 'rgba(18,18,28,0.95)' : 'rgba(255,255,255,0.95)';
  const text = isDark ? '#e5e5e5' : '#1a1a1a';
  const muted = isDark ? '#888' : '#666';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const btnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const inputStyle = { width: '100%', background: btnBg, border: `1px solid ${border}`, borderRadius: 6, padding: '5px 8px', color: text, fontSize: 10, outline: 'none' };

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, zIndex: 3000,
      width: 260, background: bg, backdropFilter: 'blur(16px)',
      border: `1px solid ${border}`, borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', padding: 12,
      color: text, fontSize: 11,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 12 }}>🛠 Debug Tools</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 11 }}>✕</button>
      </div>

      {/* Supporter section */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: muted, fontWeight: 600, marginBottom: 6 }}>Supporter Status</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: isSupporter ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: isSupporter ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {isSupporter ? '🌿 Active' : '❌ Inactive'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <button
            onClick={onActivateSupporter}
            style={{ flex: 1, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: 'none', borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
          >
            Activate
          </button>
          <button
            onClick={onResetSupporter}
            style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Promotion section */}
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10 }}>
        <div style={{ fontSize: 10, color: muted, fontWeight: 600, marginBottom: 6 }}>Simulate Promotion</div>
        <input
          placeholder="Event ID (e.g. tm-abc123)"
          value={promoEventId}
          onChange={(e) => setPromoEventId(e.target.value)}
          style={{ ...inputStyle, marginBottom: 4 }}
        />
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {['boost', 'spotlight'].map((t) => (
            <button
              key={t}
              onClick={() => setPromoTier(t)}
              style={{
                flex: 1, border: 'none', borderRadius: 6, padding: '5px 0', cursor: 'pointer',
                fontSize: 10, fontWeight: 600,
                background: promoTier === t ? 'rgba(251,191,36,0.2)' : btnBg,
                color: promoTier === t ? '#fbbf24' : muted,
              }}
            >
              {t === 'boost' ? '🚀 Boost' : '⭐ Spotlight'}
            </button>
          ))}
        </div>
        {promoStatus && <div style={{ fontSize: 9, color: '#fbbf24', marginBottom: 4 }}>{promoStatus}</div>}

        {/* Push to Redis — quick buttons */}
        <div style={{ fontSize: 10, color: muted, fontWeight: 600, marginBottom: 4 }}>Push to Redis (all devices see it)</div>
        <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={async () => {
                if (!events?.length) { setPromoStatus('No events loaded'); return; }
                setPromoStatus(`Pushing ${n}...`);
                try {
                  for (let i = 0; i < Math.min(n, events.length); i++) {
                    await fetch('/api/admin-promote', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ secret: 'tg-admin-2026-x9k', eventId: events[i].id, eventName: events[i].name, tier: promoTier }),
                    });
                  }
                  setPromoStatus(`Pushed ${Math.min(n, events.length)} to Redis`);
                } catch (err) { setPromoStatus('Error: ' + err.message); }
                setTimeout(() => setPromoStatus(null), 3000);
              }}
              style={{ flex: 1, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: 'none', borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Push specific ID */}
        <button
          onClick={async () => {
            const id = promoEventId.trim();
            if (!id) { setPromoStatus('Enter an event ID'); return; }
            setPromoStatus('Pushing...');
            try {
              const ev = events?.find((e) => e.id === id);
              const resp = await fetch('/api/admin-promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: 'tg-admin-2026-x9k', eventId: id, eventName: ev?.name || id, tier: promoTier }),
              });
              const data = await resp.json();
              setPromoStatus(data.success ? `Pushed ${id}` : data.error);
            } catch (err) { setPromoStatus('Error: ' + err.message); }
            setTimeout(() => setPromoStatus(null), 3000);
          }}
          style={{ width: '100%', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'none', borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}
        >
          Push ID to Redis
        </button>
      </div>

      <div style={{ borderTop: `1px solid ${border}`, paddingTop: 8, marginTop: 10, fontSize: 9, color: muted }}>
        Type <kbd style={{ background: btnBg, padding: '1px 4px', borderRadius: 3 }}>tgadmin</kbd> to toggle
      </div>
    </div>
  );
}

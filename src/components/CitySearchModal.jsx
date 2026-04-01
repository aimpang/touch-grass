import { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

export default function CitySearchModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const contentRef = useModalA11y(onClose);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=12&addressdetails=1&featuretype=city`);
      const data = await res.json();
      // Only keep results that are actual cities/towns/villages
      const cityTypes = new Set(['city', 'town', 'village', 'municipality', 'hamlet']);
      const cities = data
        .filter((r) => {
          const cityName = r.address?.city || r.address?.town || r.address?.village || r.address?.municipality;
          return cityName || cityTypes.has(r.type);
        })
        .slice(0, 6)
        .map((r) => ({
          name: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || r.display_name.split(',')[0],
          display: r.display_name.split(',').slice(0, 3).join(', '),
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }));
      setResults(cities);
    } catch {
      setResults([]);
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
        aria-label="Browse another city"
        className="w-[380px] rounded-2xl p-5"
        style={{ background: 'var(--panel-bg-solid)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>🌍 Browse Another City</h2>
          <button onClick={onClose} aria-label="Close" className="text-xs min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}>✕</button>
        </div>

        <form onSubmit={search} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city..."
            autoFocus
            className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="text-xs font-bold px-4 py-2 rounded-lg"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {results && (
          <div className="space-y-1.5">
            {results.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-faintest)' }}>No results found</p>
            ) : results.map((r, i) => (
              <button
                key={i}
                onClick={() => { onSelect(r.lat, r.lng, r.name); onClose(); }}
                className="w-full text-left p-3 rounded-xl transition-colors surface-hover"
              >
                <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>📍 {r.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-faintest)' }}>{r.display}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

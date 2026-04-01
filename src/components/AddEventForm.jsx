import { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

const CATEGORIES = [
  'Music', 'Food', 'Market', 'Fitness', 'Comedy',
  'Art', 'Tech', 'Sports', 'Film', 'Dance', 'Community',
];

export default function AddEventForm({ userLocation, onSubmit, onClose }) {
  const contentRef = useModalA11y(onClose);
  const [form, setForm] = useState({
    name: '',
    venue: '',
    address: '',
    phone: '',
    date: '',
    time: '19:00',
    durationHrs: 2,
    category: 'Community',
    free: true,
    price: '',
    description: '',
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.venue || !form.date) return;

    onSubmit({
      name: form.name,
      venue: form.venue,
      address: form.address || null,
      phone: form.phone || null,
      lat: userLocation.lat,
      lng: userLocation.lng,
      date: `${form.date}T${form.time}`,
      durationHrs: Number(form.durationHrs) || 2,
      category: form.category,
      free: form.free,
      price: form.free ? null : Number(form.price) || 0,
      description: form.description || `${form.name} at ${form.venue}.`,
    });
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-overlay)',
    color: 'var(--text)',
    fontSize: 12,
    outline: 'none',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-faint)',
    display: 'block',
    marginBottom: 4,
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <form
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add event"
        onSubmit={handleSubmit}
        className="w-[400px] max-h-[85vh] overflow-y-auto rounded-2xl p-5"
        style={{ background: 'var(--panel-bg-solid)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Add Event 🌿</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xs min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}>
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label style={labelStyle}>Event Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="What's happening?" required />
          </div>

          <div>
            <label style={labelStyle}>Venue *</label>
            <input style={inputStyle} value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Where at?" required />
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Date *</label>
              <input style={inputStyle} type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input style={inputStyle} type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Duration (hours)</label>
              <input style={inputStyle} type="number" min="0.5" max="48" step="0.5" value={form.durationHrs} onChange={(e) => update('durationHrs', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={(e) => update('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Pricing</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => update('free', true)}
                  className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: form.free ? 'rgba(52,211,153,0.15)' : 'var(--surface-overlay)', color: form.free ? '#34d399' : 'var(--text-faint)' }}
                >Free</button>
                <button type="button" onClick={() => update('free', false)}
                  className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: !form.free ? 'rgba(251,191,36,0.15)' : 'var(--surface-overlay)', color: !form.free ? '#fbbf24' : 'var(--text-faint)' }}
                >Paid</button>
              </div>
            </div>
            {!form.free && (
              <div>
                <label style={labelStyle}>Price ($)</label>
                <input style={inputStyle} type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="0" />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 555-0123" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Tell people what to expect..." />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 text-xs py-2.5 rounded-xl font-medium" style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}>
            Cancel
          </button>
          <button type="submit" className="flex-1 text-xs py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors">
            Add Event
          </button>
        </div>

        <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-faintest)' }}>
          Event will be placed at your current location
        </p>
      </form>
    </div>
  );
}

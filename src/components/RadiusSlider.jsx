export default function RadiusSlider({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[11px] shrink-0 font-medium" style={{ color: 'var(--text-faint)' }}>📏 Radius</label>
      <input
        type="range"
        min={1}
        max={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-emerald-500 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(52,211,153,0.4)]"
        style={{ background: 'var(--border-hover)' }}
      />
      <span className="text-[11px] font-mono w-12 text-right font-medium" style={{ color: 'var(--text-faint)' }}>{value} km</span>
    </div>
  );
}

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'touchgrass-hints-seen';

function getSeenHints() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function markSeen(id) {
  const seen = getSeenHints();
  seen[id] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

function wasSeenRecently(id, hoursAgo = 24) {
  const seen = getSeenHints();
  if (!seen[id]) return false;
  return Date.now() - seen[id] < hoursAgo * 3600000;
}

export function useHints({ isSupporter, eventCount, pinnedCount }) {
  const [hint, setHint] = useState(null);

  useEffect(() => {
    const timers = [];

    function show(id, message, emoji, action, delay) {
      if (wasSeenRecently(id)) return;
      timers.push(setTimeout(() => {
        setHint({ id, message, emoji, action });
      }, delay));
    }

    // After 10s: suggest supporting if not a supporter and has browsed events
    if (!isSupporter && eventCount > 0) {
      show('support-hint', 'Enjoying Touch Grass? Support us to unlock unlimited pins!', '🌿', 'support', 10000);
    }

    // After 25s: suggest promoting if they've been browsing
    if (eventCount > 5) {
      show('promote-hint', 'Are you an event organizer? Hover any event card and tap 🚀 to promote it!', '🚀', null, 25000);
    }

    // After 30s: suggest sharing
    if (eventCount > 0) {
      show('share-hint', 'Liking Touch Grass? Share it with your friends!', '💚', 'share', 30000);
    }

    // After 5s: first-time hint about pinning
    if (pinnedCount === 0 && eventCount > 0) {
      show('pin-hint', 'Tip: Hover over an event card and tap 📌 to pin it for later!', '💡', null, 5000);
    }

    return () => timers.forEach(clearTimeout);
  }, [isSupporter, eventCount, pinnedCount]);

  function dismiss() {
    if (hint) markSeen(hint.id);
    setHint(null);
  }

  return { hint, dismiss };
}

export default function HintToast({ hint, onDismiss, onAction }) {
  if (!hint) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1800] max-w-sm w-[90vw] animate-[slideUp_0.3s_ease-out]"
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: 'var(--panel-bg-solid)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <span className="text-lg shrink-0 mt-0.5">{hint.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {hint.message}
          </p>
          {hint.action && (
            <button
              onClick={() => { onAction(hint.action); onDismiss(); }}
              className="text-[11px] font-bold mt-1.5 px-3 py-1 rounded-full transition-colors"
              style={{
                background: hint.action === 'share' ? 'rgba(52,211,153,0.15)' : hint.action === 'support' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                color: hint.action === 'share' ? '#34d399' : hint.action === 'support' ? '#34d399' : '#fbbf24',
              }}
            >
              {hint.action === 'support' ? 'Learn more' : hint.action === 'share' ? 'Share' : 'Promote an event'}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss hint"
          className="shrink-0 w-7 h-7 flex items-center justify-center text-[10px] mt-0.5 opacity-40 hover:opacity-80"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

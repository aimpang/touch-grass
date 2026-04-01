// Returns the temporal status of an event
// { key, label, color, bgColor }
export function getEventStatus(event) {
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = start + (event.durationHrs || 2) * 60 * 60 * 1000;
  const msUntilStart = start - now;
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

  if (now > end && now < end + 60 * 60 * 1000) {
    // Ended within the last hour
    return { key: 'ended', label: 'Just ended', color: '#8a8a8a', bgColor: 'rgba(138,138,138,0.15)' };
  }

  if (now >= start && now <= end) {
    return { key: 'live', label: 'Happening now', color: '#f43f5e', bgColor: 'rgba(244,63,94,0.15)' };
  }

  if (hoursUntilStart > 0 && hoursUntilStart <= 1) {
    return { key: 'soon', label: 'Starting soon', color: '#fb923c', bgColor: 'rgba(251,146,60,0.15)' };
  }

  if (hoursUntilStart > 1 && hoursUntilStart <= 3) {
    return { key: 'nearby', label: `In ${Math.ceil(hoursUntilStart)}h`, color: '#facc15', bgColor: 'rgba(250,204,21,0.12)' };
  }

  return null; // No special status — upcoming or past
}

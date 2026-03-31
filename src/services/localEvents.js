const STORAGE_KEY = 'touchgrass-local-events';

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function write(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function getLocalEvents() {
  return read().map((e) => ({ ...e, source: 'local' }));
}

export function addLocalEvent(event) {
  const events = read();
  const newEvent = {
    ...event,
    id: `local-${Date.now()}`,
    source: 'local',
  };
  events.push(newEvent);
  write(events);
  return newEvent;
}

export function removeLocalEvent(id) {
  const events = read().filter((e) => e.id !== id);
  write(events);
}

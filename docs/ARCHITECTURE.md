# Touch Grass 🌱

> Stop doomscrolling. Find events near you and go outside.

Touch Grass is an event discovery app that aggregates concerts, food festivals, comedy shows, sports, art walks, and more from multiple sources onto an interactive map. Built for introverts who need a nudge to go outside.

**Live:** [touch-grass-blond.vercel.app](https://touch-grass-blond.vercel.app)

---

## Features

- **Real-time event map** — Interactive Leaflet map with category-colored markers
- **Multi-source aggregation** — Ticketmaster + PredictHQ, deduplicated
- **Smart sorting** — Live events first, then starting soon, then upcoming by proximity
- **Filters** — By radius, price (free/paid), category, time (today/tonight/weekend/custom date range), text search
- **Event status** — Live, Starting Soon, In Xh, Just Ended, Sold Out, Rescheduled badges
- **Pin events** — Pin favorites to the top of the list
- **Info cards** — Click a map marker for details, links, and directions
- **Dark/light theme** — Toggle with theme persistence
- **Mobile responsive** — Bottom sheet layout on phones, side panel on desktop
- **Works anywhere** — GPS + IP geolocation fallback, supports Canada & US
- **Privacy first** — No accounts, no cookies, no tracking. Everything stays in your browser

---

## Architecture

```
src/
├── App.jsx                    # Root — layout, state, mobile/desktop switch
├── main.jsx                   # Entry point with ThemeProvider
├── index.css                  # CSS variables, Tailwind, animations
│
├── components/
│   ├── EventCard.jsx          # Event card with status badges, glow effects
│   ├── EventPanel.jsx         # Sidebar — filters, search, event grid
│   ├── Map.jsx                # Leaflet map, markers, controls
│   ├── MapInfoCard.jsx        # Popup card anchored to map markers
│   ├── RadiusSlider.jsx       # Distance slider
│   ├── AddEventForm.jsx       # Local event creation form (coming soon)
│   └── AboutModal.jsx         # About / Privacy / Terms
│
├── hooks/
│   ├── useGeolocation.js      # GPS → IP fallback → US center
│   ├── useEvents.js           # Fetch, filter, sort events
│   ├── useTheme.jsx           # Dark/light context + localStorage
│   └── useIPLocation.js       # IP-based geolocation (ipapi.co)
│
├── services/
│   ├── eventService.js        # Orchestrator — fetches all sources in parallel
│   ├── ticketmaster.js        # Ticketmaster Discovery API
│   ├── predicthq.js           # PredictHQ Events API
│   ├── localEvents.js         # localStorage CRUD for user events
│   ├── normalize.js           # Maps API responses → common event schema
│   └── fetchWithTimeout.js    # Fetch wrapper with 8s timeout + retry
│
├── utils/
│   ├── distance.js            # Haversine formula
│   └── eventStatus.js         # Temporal status (live/soon/nearby/ended)
│
└── data/
    └── mockEvents.js          # 20 Toronto demo events (fallback)

api/                           # Vercel serverless functions
├── ticketmaster.js            # Proxy — adds API key server-side
└── predicthq.js               # Proxy — adds Bearer token server-side

public/
├── favicon.svg                # 🌱 emoji favicon
└── manifest.json              # PWA manifest
```

---

## Event Data Schema

All events are normalized to this shape regardless of source:

```js
{
  id: string,           // "tm-abc123", "phq-xyz", "local-1234567890"
  name: string,
  venue: string,
  address: string | null,
  phone: string | null,
  lat: number,
  lng: number,
  date: string,         // ISO: "2026-04-05T20:00:00"
  durationHrs: number,
  category: string,     // Music | Food | Market | Fitness | Comedy | Art | Tech | Sports | Film | Dance | Community
  free: boolean,
  price: number | null,
  saleStatus: string,   // onsale | soldout | offsale | rescheduled
  description: string,
  source: string,       // ticketmaster | predicthq | local | mock
  url: string | null,
  distance?: number,    // Added at runtime (km from user)
}
```

---

## Data Flow

```
Browser GPS / IP geolocation
        │
        ▼
   useGeolocation()  →  location { lat, lng }
        │
        ▼
    useEvents()
        │
        ├── fetchTicketmasterEvents(lat, lng, radius)
        │       └── /api/ticketmaster (serverless proxy)
        │               └── app.ticketmaster.com/discovery/v2/events.json
        │
        ├── fetchPredictHQEvents(lat, lng, radius)
        │       └── /api/predicthq (serverless proxy)
        │               └── api.predicthq.com/v1/events/
        │
        ├── getLocalEvents()  →  localStorage
        │
        └── (fallback) mockEvents.js
                │
                ▼
        normalize → dedupe → filter → sort
                │
                ▼
        { events, pastEvents, isFallback }
                │
                ▼
        EventPanel (cards) + Map (markers)
```

---

## API Keys & Security

**Production:** API keys live in Vercel environment variables (server-side only). The browser never sees them.

| Variable | Where | Used by |
|----------|-------|---------|
| `TICKETMASTER_KEY` | Vercel env | `api/ticketmaster.js` |
| `PREDICTHQ_KEY` | Vercel env | `api/predicthq.js` |
| `VITE_TICKETMASTER_KEY` | `.env` (dev only) | Direct API calls in dev |
| `VITE_PREDICTHQ_KEY` | `.env` (dev only) | Vite proxy in dev |

---

## Smart Sorting

Events are sorted by temporal priority:

| Priority | Status | Tiebreaker |
|----------|--------|------------|
| 1 | Happening now | Closest distance |
| 2 | Starting soon (<1h) | Closest distance |
| 3 | Starting in 1-3h | Closest distance |
| 4 | Upcoming (>3h) | Soonest start time |
| 5 | Just ended (<1h) | Most recently ended |

Pinned events always float to the top. Past events (ended >1h, <48h) are in a collapsible section.

---

## Filters

| Filter | Options |
|--------|---------|
| **Radius** | 1–50 km slider |
| **Price** | All, Free |
| **Category** | All, Music, Food, Comedy, Art, Tech, Sports |
| **Time** | Anytime, Today, Tonight, Tomorrow, Weekend, This Week, Custom date range |
| **Search** | Text search across name, venue, description, category |

All filters are client-side and instant after the initial API fetch.

---

## Theme System

CSS custom properties in `:root` / `[data-theme="light"]`:

- `--bg`, `--text`, `--text-muted`, `--text-faint`, `--text-faintest`
- `--panel-bg`, `--panel-bg-solid`, `--card-bg`
- `--border`, `--border-hover`, `--surface-overlay`
- `--marker-bg`, `--infocard-bg`, `--scrollbar`

Map tiles switch between CARTO `dark_all` and `voyager`.

---

## Performance

- **Viewport culling** — Only markers in view (+30% buffer) are rendered
- **Fetch caching** — Refetch only if location moved >1km or radius >2km
- **Icon cache** — Marker SVGs cached by category+state
- **Canvas rendering** — `preferCanvas={true}` for map overlays
- **Tile buffering** — 4-tile pre-load buffer, idle-only updates
- **Timeout + retry** — 8s timeout, 2 retries with exponential backoff

---

## Local Development

```bash
# Install
npm install

# Set up env
cp .env.example .env
# Add your API keys to .env

# Run dev server (with API proxies)
npm run dev
# → http://localhost:5173

# Build
npm run build
```

---

## Deployment

Deployed on Vercel with serverless API proxies.

```bash
# Deploy
vercel --prod

# Set production env vars (one-time)
vercel env add TICKETMASTER_KEY production
vercel env add PREDICTHQ_KEY production
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3 | UI framework |
| react-dom | 18.3 | DOM rendering |
| leaflet | 1.9 | Map library |
| react-leaflet | 4.2 | React wrapper for Leaflet |
| tailwindcss | 3.4 | Utility CSS |
| vite | 5.4 | Build tool + dev server |

---

## Browser Storage

| Key | Content |
|-----|---------|
| `tg-theme` | `"dark"` or `"light"` |
| `touchgrass-local-events` | User-created events (JSON) |
| `touchgrass-ip-location` | Cached IP geolocation (sessionStorage) |

No cookies. No server-side storage. No tracking.

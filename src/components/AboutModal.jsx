import { useState } from 'react';

export default function AboutModal({ onClose }) {
  const [page, setPage] = useState('about');

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-[380px] max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--panel-bg-solid)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Touch Grass
            </span>
          </h2>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface-overlay)', color: 'var(--text-faint)' }}>✕</button>
        </div>

        <div className="flex gap-1 mb-4 p-0.5 rounded-lg" style={{ background: 'var(--surface-overlay)' }}>
          {[['about', 'About'], ['privacy', 'Privacy'], ['terms', 'Terms']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              className="flex-1 text-[10px] py-1.5 rounded-md font-medium transition-colors"
              style={{
                background: page === key ? 'var(--surface-overlay-hover)' : 'transparent',
                color: page === key ? 'var(--text)' : 'var(--text-faintest)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ minHeight: 220, overflow: 'auto' }}>
          <div style={{ display: page === 'about' ? 'block' : 'none' }}>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p className="mb-3">
                Discover events near you — concerts, food, comedy, sports, meetups, and more. All on a live map.
              </p>
              <div className="space-y-1 text-[10px]" style={{ color: 'var(--text-faintest)' }}>
                <p>Events from <A href="https://www.ticketmaster.com">Ticketmaster</A>, <A href="https://www.predicthq.com">PredictHQ</A> & <A href="https://www.meetup.com">Meetup</A></p>
                <p>Maps by <A href="https://carto.com">CARTO</A> & <A href="https://www.openstreetmap.org">OpenStreetMap</A></p>
              </div>
              <div className="mt-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-[10px]" style={{ color: 'var(--text-faintest)' }}>
                  For business inquiries, partnerships, or support:<br />
                  <A href="mailto:info@touch-grass.fyi">info@touch-grass.fyi</A>
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-faintest)' }}>
                  Found a bug? Let us know at <A href="mailto:info@touch-grass.fyi?subject=Bug Report">info@touch-grass.fyi</A>
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: page === 'privacy' ? 'block' : 'none' }}>
            <div className="text-[11px] leading-relaxed space-y-2.5" style={{ color: 'var(--text-muted)' }}>
              <P title="Location">
                We use your browser's location or IP-based approximation to find nearby events. Your location is never stored on our servers.
              </P>
              <P title="Data">
                Pins, theme, and supporter status are stored in your browser only. No accounts, no personal data on our servers.
              </P>
              <P title="Third Parties">
                Event data from Ticketmaster, PredictHQ, and Meetup is proxied through our server — your IP isn't shared. Payments via Stripe.
              </P>
              <P title="Promotions">
                Promoted event IDs and expiration dates are stored in our database. No organizer personal data beyond Stripe payment info.
              </P>
              <P title="Analytics">
                Anonymous page views via Vercel Analytics. No cookies, no personal identifiers.
              </P>
              <P title="Contact">
                <A href="mailto:info@touch-grass.fyi">info@touch-grass.fyi</A>
              </P>
            </div>
          </div>

          <div style={{ display: page === 'terms' ? 'block' : 'none' }}>
            <div className="text-[11px] leading-relaxed space-y-2.5" style={{ color: 'var(--text-muted)' }}>
              <P title="Acceptance">
                By using Touch Grass, you agree to these terms. If you don't agree, please
                don't use the service.
              </P>
              <P title="Service Description">
                Touch Grass is an event discovery tool that aggregates publicly available event
                information from third-party sources including Ticketmaster, PredictHQ, and Meetup.
                We do not organize, host, or sell tickets to any events displayed.
              </P>
              <P title="Event Content">
                All event data is sourced from third-party platforms. We do not create, verify,
                endorse, or moderate event listings. Events are displayed as provided by their
                respective sources. We are not responsible for the accuracy, safety, legality,
                or nature of any event listed.
              </P>
              <P title="Accuracy">
                Event information (dates, prices, venues, availability) may not always be accurate
                or up to date. Always verify details with the event organizer or ticketing platform
                before making plans. We are not responsible for inaccurate or outdated information.
              </P>
              <P title="Supporter Program">
                The supporter program is a one-time voluntary payment ($9.99 CAD) that unlocks
                additional features. It is non-refundable. Features may change over time.
              </P>
              <P title="Event Promotions">
                Event organizers can pay to promote their events on the platform. Promoted events
                receive enhanced visibility for the purchased duration. Promotions are non-refundable
                once activated. We reserve the right to remove promotions that violate these terms.
              </P>
              <P title="Prohibited Use">
                You may not use Touch Grass to promote illegal activities, misleading events,
                or content that violates the terms of our data sources. We reserve the right to
                remove any promoted content at our discretion.
              </P>
              <P title="Affiliate Links">
                Some event links may contain affiliate tracking. If you purchase a ticket through
                these links, we may receive a commission at no additional cost to you.
              </P>
              <P title="Availability">
                The service is provided "as is" without warranty. We may experience downtime,
                API rate limits, or data source changes that affect availability. We reserve the
                right to modify or discontinue the service at any time.
              </P>
              <P title="Third-Party Content">
                Links to external sites (ticket purchases, venue pages, Meetup groups) are provided
                for convenience. We are not responsible for third-party content, transactions, or services.
              </P>
              <P title="Intellectual Property">
                Touch Grass is an independent project. Ticketmaster, PredictHQ, Meetup, Stripe,
                CARTO, OpenStreetMap, and Leaflet are trademarks of their respective owners.
              </P>
              <P title="Limitation of Liability">
                Touch Grass and its creators shall not be liable for any damages arising from use
                of this service, including but not limited to missed events, incorrect information,
                service interruptions, or any incidents related to events discovered through the platform.
              </P>
              <P title="Changes">
                We may update these terms at any time. Continued use of the service constitutes
                acceptance of any changes.
              </P>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-faintest)' }}>
            Made with 🌿 for people who need to go outside
          </p>
        </div>
      </div>
    </div>
  );
}

function P({ title, children }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold mb-0.5" style={{ color: 'var(--text)' }}>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function A({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{children}</a>;
}

import { Link } from 'react-router-dom';
import { Ticket, Play, CalendarX } from 'lucide-react';
import type { EventItem } from '../lib/types';
import { fmtDate, isUpcoming } from '../lib/format';

export function EventRow({ event, onRecap }: { event: EventItem; onRecap?: (youtubeId: string) => void }) {
  const d = event.date ? new Date(event.date + 'T00:00:00') : null;
  const upcoming = isUpcoming(event);
  return (
    <div className="event-row">
      <div className="event-row__date">
        {d ? <>{d.getDate()}<small>{d.toLocaleString('en-GB', { month: 'short' })} {d.getFullYear()}</small></> : <>—<small>Date not published</small></>}
      </div>
      <div>
        <h3 className="event-row__title">{event.title}</h3>
        <div className="event-row__venue">{[event.venue, event.city, event.country].filter(Boolean).join(' · ') || 'Venue to be announced'}</div>
        {event.description && <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>{event.description}</p>}
      </div>
      <div className="muted" style={{ fontSize: 14 }}>{event.time || ''}{event.ticketPrice ? ` · ${event.ticketPrice}` : ''}</div>
      <div className="event-row__actions">
        {upcoming ? (
          event.ticketUrl ? <a className="btn btn--accent btn--sm" href={event.ticketUrl} target="_blank" rel="noopener noreferrer"><Ticket size={14} /> Tickets</a> : <span className="chip">Tickets TBA</span>
        ) : event.recapVideoId && onRecap ? <button className="btn btn--ghost btn--sm" onClick={() => onRecap(event.recapVideoId!)}><Play size={14} /> Watch recap</button> : <span className="chip">{event.status === 'cancelled' ? 'Cancelled' : 'Past event'}</span>}
      </div>
    </div>
  );
}
export function EmptyEvents({ upcoming = true }: { upcoming?: boolean }) {
  return (
    <div className="empty-state">
      <CalendarX size={32} className="muted" aria-hidden />
      <p className="display">{upcoming ? 'No dates announced yet' : 'No past events listed'}</p>
      <p className="muted" style={{ maxWidth: '48ch', margin: 0 }}>{upcoming ? 'New shows are announced here first. Join the mailing list or send a booking inquiry to bring RANO to your city.' : 'Event history will appear here once confirmed.'}</p>
      <div className="row"><Link to="/contact" className="btn btn--accent btn--sm">Booking inquiry</Link><Link to="/#newsletter" className="btn btn--ghost btn--sm">Get notified</Link></div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { isUpcoming } from '../lib/format';
import type { Video } from '../lib/types';
import { Reveal, SectionHead } from '../components/ui';
import { EventRow, EmptyEvents } from '../components/EventList';
import { VideoModal } from '../components/VideoCards';
import NewsletterForm from '../components/NewsletterForm';

export default function Events() {
  const { content } = useContent();
  const [video, setVideo] = useState<Video | null>(null);
  usePageMeta('Events — RANO', 'Upcoming shows, appearances and past events from Ugakid RANO.');
  if (!content) return null;
  const upcoming = content.events.filter(isUpcoming).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const past = content.events.filter(e => !isUpcoming(e));
  const onRecap = (id: string) => { const v = content.videos.find(x => x.youtubeId === id); setVideo(v || { id, title: 'Event recap', youtubeId: id, category: 'Event Recap' }); };
  return (
    <>
      <div className="page-hero" data-word="Live"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Events</span></div><p className="eyebrow">Live</p><h1 className="display h1">Events</h1><p className="lead">Shows, festivals and the Rolexperience. Dates are published here only once confirmed.</p></div></div>
      <section className="section"><div className="container">
        <Reveal><SectionHead eyebrow="Upcoming" title="On the road" /></Reveal>
        <Reveal>{upcoming.length ? <div className="event-list">{upcoming.map(e => <EventRow key={e.id} event={e} />)}</div> : <EmptyEvents />}</Reveal>
      </div></section>
      <section className="section section--surface"><div className="container">
        <Reveal><SectionHead eyebrow="History" title="Past events" /></Reveal>
        <Reveal>{past.length ? <div className="event-list">{past.map(e => <EventRow key={e.id} event={e} onRecap={onRecap} />)}</div> : <EmptyEvents upcoming={false} />}</Reveal>
      </div></section>
      <section className="section section--tight"><div className="container"><Reveal className="newsletter"><div><p className="eyebrow">Never miss a date</p><h2 className="display h3">Get show alerts</h2><p className="muted" style={{ marginBottom: 0 }}>Be first to hear when new dates are announced.</p></div><NewsletterForm source="events" /></Reveal></div></section>
      <VideoModal video={video} onClose={() => setVideo(null)} />
    </>
  );
}

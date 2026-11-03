import { useEffect, useRef, type ReactNode } from 'react';
import { X, Youtube, Instagram, Twitter, Facebook, Music2, Headphones, AudioLines, Globe, Mail } from 'lucide-react';
import { useReveal, useLockBody, useFocusTrap } from '../lib/hooks';
import { cx } from '../lib/format';
import type { Social } from '../lib/types';

export function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: 0 | 1 | 2 | 3; as?: any }) {
  const ref = useReveal<HTMLDivElement>();
  return <Tag ref={ref} className={cx('reveal', delay ? `reveal-delay-${delay}` : '', className)}>{children}</Tag>;
}
export function SectionHead({ eyebrow, title, lead, right }: { eyebrow: string; title: ReactNode; lead?: string; right?: ReactNode }) {
  return (
    <div className="section-head">
      <div><p className="eyebrow">{eyebrow}</p><h2 className="display h2">{title}</h2>{lead && <p className="lead">{lead}</p>}</div>
      {right}
    </div>
  );
}
export function Loader({ label = 'Loading' }: { label?: string }) {
  return <div className="loader" role="status" aria-live="polite"><div className="spinner" /><span className="mono muted">{label}</span></div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="container section"><div className="empty-state"><p className="display h3">Something went wrong</p><p className="muted">{message}</p>{onRetry && <button className="btn btn--ghost" onClick={onRetry}>Try again</button>}</div></div>;
}
export function Modal({ open, onClose, children, label, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; label: string; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLockBody(open);
  useFocusTrap(open, ref, onClose);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={label} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal__panel" ref={ref} style={wide ? { width: 'min(1400px,100%)' } : undefined}>
        <button className="icon-btn modal__close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {children}
      </div>
    </div>
  );
}
export function socialIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes('youtube')) return Youtube;
  if (p.includes('instagram')) return Instagram;
  if (p.includes('twitter') || p === 'x') return Twitter;
  if (p.includes('facebook')) return Facebook;
  if (p.includes('apple')) return Music2;
  if (p.includes('spotify')) return AudioLines;
  if (p.includes('audiomack') || p.includes('boomplay')) return Headphones;
  if (p.includes('mail') || p.includes('email')) return Mail;
  return Globe;
}
export function SocialLinks({ socials, size = 18, showLabel = false }: { socials: Social[]; size?: number; showLabel?: boolean }) {
  return (
    <div className="socials">
      {socials.map(s => { const Icon = socialIcon(s.platform); return (
        <a key={s.platform + s.url} href={s.url} target="_blank" rel="noopener noreferrer" className={showLabel ? 'platform' : 'icon-btn'} aria-label={`${s.platform}${s.handle ? ` (${s.handle})` : ''}`} title={s.platform}>
          <Icon size={size} />{showLabel && <span>{s.platform}</span>}
        </a>
      ); })}
    </div>
  );
}
export function StreamingLinks({ release, compact = false }: { release: { appleUrl?: string | null; spotifyUrl?: string | null; youtubeUrl?: string | null; audiomackUrl?: string | null }; compact?: boolean }) {
  const links = [
    { k: 'appleUrl', label: 'Apple Music', Icon: Music2 },
    { k: 'spotifyUrl', label: 'Spotify', Icon: AudioLines },
    { k: 'youtubeUrl', label: 'YouTube', Icon: Youtube },
    { k: 'audiomackUrl', label: 'Audiomack', Icon: Headphones },
  ] as const;
  const available = links.filter(l => (release as any)[l.k]);
  if (!available.length) return compact ? null : <p className="muted" style={{ fontSize: 14 }}>Streaming links will be added when confirmed.</p>;
  return <div className="platforms">{available.map(l => <a key={l.k} className="platform" href={(release as any)[l.k]} target="_blank" rel="noopener noreferrer"><l.Icon />{l.label}</a>)}</div>;
}
export function DemoBanner({ children }: { children: ReactNode }) {
  return <div className="demo-banner" role="note"><span aria-hidden>⚠</span><div>{children}</div></div>;
}

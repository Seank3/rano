import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Release, Track } from './types';

export interface QueueItem { release: Release; track: Track; }
interface PlayerState {
  queue: QueueItem[]; index: number; playing: boolean; currentTime: number; duration: number; volume: number; error: string | null; loading: boolean;
  playRelease: (r: Release, trackIndex?: number) => void; playQueue: (items: QueueItem[], index?: number) => void;
  toggle: () => void; next: () => void; prev: () => void; seek: (t: number) => void; setVolume: (v: number) => void; close: () => void;
}
const Ctx = createContext<PlayerState | null>(null);
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(0.9);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const a = new Audio(); a.preload = 'metadata'; audioRef.current = a;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => { setDuration(a.duration || 0); setLoading(false); };
    const onEnd = () => setPlaying(false);
    const onErr = () => { setError('Preview unavailable right now. Open the track on Apple Music to listen.'); setPlaying(false); setLoading(false); };
    const onPlay = () => { setPlaying(true); setError(null); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    a.addEventListener('timeupdate', onTime); a.addEventListener('loadedmetadata', onMeta); a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr); a.addEventListener('play', onPlay); a.addEventListener('pause', onPause);
    a.addEventListener('waiting', onWaiting); a.addEventListener('canplay', onCanPlay);
    return () => { a.pause(); a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('ended', onEnd); a.removeEventListener('error', onErr); a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause); a.removeEventListener('waiting', onWaiting); a.removeEventListener('canplay', onCanPlay); };
  }, []);

  const current = queue[index];
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    if (!current?.track.previewUrl) { a.removeAttribute('src'); a.load(); setPlaying(false); return; }
    setError(null); setCurrentTime(0); setDuration(0); setLoading(true);
    a.src = current.track.previewUrl; a.volume = volume; a.load();
    a.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setLoading(false); });
  }, [current?.track.previewUrl, current?.release.id, current?.track.n]);

  useEffect(() => { const a = audioRef.current; if (a) a.volume = volume; }, [volume]);
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.track.title, artist: current.release.artist, album: current.release.title, artwork: current.release.artwork ? [{ src: current.release.artwork, sizes: '600x600', type: 'image/jpeg' }] : [] });
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => setIndex(i => Math.max(0, i - 1)));
    navigator.mediaSession.setActionHandler('nexttrack', () => setIndex(i => Math.min(queue.length - 1, i + 1)));
  }, [current, queue.length]);

  const playQueue = (items: QueueItem[], i = 0) => {
    const playable = items.filter(x => x.track.previewUrl);
    if (!playable.length) return;
    const target = items[i]?.track.previewUrl ? i : items.findIndex(x => x.track.previewUrl);
    setQueue(items); setIndex(Math.max(0, target));
  };
  const playRelease = (r: Release, trackIndex = 0) => {
    const tracks = r.tracks?.length ? r.tracks : [{ n: 1, title: r.title, durationMs: r.durationMs, previewUrl: r.previewUrl }];
    playQueue(tracks.map(t => ({ release: r, track: t })), trackIndex);
  };
  const toggle = () => { const a = audioRef.current; if (!a || !current?.track.previewUrl) return; if (a.paused) a.play().catch(() => setError('Playback was blocked. Tap play again.')); else a.pause(); };
  const next = () => setIndex(i => Math.min(queue.length - 1, i + 1));
  const prev = () => { const a = audioRef.current; if (a && a.currentTime > 3) { a.currentTime = 0; return; } setIndex(i => Math.max(0, i - 1)); };
  const seek = (t: number) => { const a = audioRef.current; if (a) { a.currentTime = t; setCurrentTime(t); } };
  const close = () => { const a = audioRef.current; if (a) { a.pause(); a.removeAttribute('src'); a.load(); } setQueue([]); setPlaying(false); setCurrentTime(0); setDuration(0); };
  return <Ctx.Provider value={{ queue, index, playing, currentTime, duration, volume, error, loading, playRelease, playQueue, toggle, next, prev, seek, setVolume: setVol, close }}>{children}</Ctx.Provider>;
}
export function usePlayer() { const c = useContext(Ctx); if (!c) throw new Error('usePlayer outside provider'); return c; }

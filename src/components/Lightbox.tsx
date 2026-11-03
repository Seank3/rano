import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryItem } from '../lib/types';
import { Modal } from './ui';

export default function Lightbox({ items, index, onClose, onIndex }: { items: GalleryItem[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const open = index !== null && index >= 0 && index < items.length;
  const prev = useCallback(() => { if (index !== null) onIndex((index - 1 + items.length) % items.length); }, [index, items.length, onIndex]);
  const next = useCallback(() => { if (index !== null) onIndex((index + 1) % items.length); }, [index, items.length, onIndex]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open, prev, next]);
  const item = open ? items[index!] : null;
  return (
    <Modal open={open} onClose={onClose} label={item ? `Image: ${item.alt || item.caption || ''}` : 'Gallery image'} wide>
      {item && (<>
        <span className="lightbox__count">{index! + 1} / {items.length}</span>
        <button className="icon-btn lightbox__nav lightbox__nav--prev" onClick={prev} aria-label="Previous image"><ChevronLeft size={22} /></button>
        <img key={item.id} className="lightbox__img" src={item.src} alt={item.alt || item.caption || ''} />
        <button className="icon-btn lightbox__nav lightbox__nav--next" onClick={next} aria-label="Next image"><ChevronRight size={22} /></button>
        <div className="lightbox__caption">{item.caption}{item.category ? ` · ${item.category}` : ''}</div>
      </>)}
    </Modal>
  );
}

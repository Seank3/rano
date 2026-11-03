import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('is-visible'); return; }
    const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { el.classList.add('is-visible'); io.unobserve(el); } }); }, { threshold });
    io.observe(el); return () => io.disconnect();
  }, [threshold]);
  return ref;
}
export function useScrolled(offset = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const on = () => setScrolled(window.scrollY > offset); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, [offset]);
  return scrolled;
}
export function useLockBody(locked: boolean) {
  useEffect(() => { if (!locked) return; const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prev; }; }, [locked]);
}
export function useFocusTrap(active: boolean, ref: React.RefObject<HTMLElement | null>, onClose?: () => void) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const first = el.querySelector<HTMLElement>(sel); first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.(); }
      if (e.key === 'Tab') {
        const nodes = Array.from(el.querySelectorAll<HTMLElement>(sel)).filter(n => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [active, ref, onClose]);
}
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) { let m = document.querySelector('meta[name="description"]'); if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); } m.setAttribute('content', description); }
  }, [title, description]);
}

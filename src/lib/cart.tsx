import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from './types';
export interface CartItem { productId: string; name: string; priceCents: number; currency: string; image?: string; qty: number; size?: string; color?: string; }
const Ctx = createContext<{ items: CartItem[]; add: (p: Product, opts?: { qty?: number; size?: string; color?: string }) => void; remove: (i: number) => void; setQty: (i: number, q: number) => void; clear: () => void; count: number; total: number } | null>(null);
const KEY = 'rano_cart_v1';
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);
  const add: any = (p: Product, opts: any = {}) => {
    setItems(prev => {
      const i = prev.findIndex(x => x.productId === p.id && x.size === opts.size && x.color === opts.color);
      if (i >= 0) { const n = [...prev]; n[i] = { ...n[i], qty: Math.min(20, n[i].qty + (opts.qty || 1)) }; return n; }
      return [...prev, { productId: p.id, name: p.name, priceCents: p.priceCents, currency: p.currency, image: p.images?.[0], qty: opts.qty || 1, size: opts.size, color: opts.color }];
    });
  };
  const remove = (i: number) => setItems(prev => prev.filter((_, j) => j !== i));
  const setQty = (i: number, q: number) => setItems(prev => prev.map((x, j) => j === i ? { ...x, qty: Math.max(1, Math.min(20, q)) } : x));
  const clear = () => setItems([]);
  const count = items.reduce((a, b) => a + b.qty, 0);
  const total = items.reduce((a, b) => a + b.priceCents * b.qty, 0);
  return <Ctx.Provider value={{ items, add, remove, setQty, clear, count, total }}>{children}</Ctx.Provider>;
}
export function useCart() { const c = useContext(Ctx); if (!c) throw new Error('useCart outside provider'); return c; }

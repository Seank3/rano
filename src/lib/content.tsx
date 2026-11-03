import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Content } from './types';

const ContentContext = createContext<{ content: Content | null; loading: boolean; error: string | null; refresh: () => Promise<void> }>({ content: null, loading: true, error: null, refresh: async () => {} });
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    try { setError(null); const c = await api.content(); setContent(c); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load content'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  return <ContentContext.Provider value={{ content, loading, error, refresh }}>{children}</ContentContext.Provider>;
}
export function useContent() { return useContext(ContentContext); }

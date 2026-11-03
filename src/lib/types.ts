export interface Track { n: number; title: string; durationMs?: number | null; previewUrl?: string | null; }
export interface Release {
  id: string; slug: string; title: string; artist: string; type: 'single' | 'album' | 'ep' | 'feature';
  date?: string | null; genre?: string | null; artwork?: string | null; description?: string | null;
  appleUrl?: string | null; spotifyUrl?: string | null; youtubeUrl?: string | null; audiomackUrl?: string | null;
  previewUrl?: string | null; durationMs?: number | null; credits?: string[]; tracks?: Track[]; featured?: boolean; sort?: number;
}
export interface Video { id: string; title: string; youtubeId: string; date?: string | null; thumbnail?: string | null; description?: string | null; category?: string | null; featured?: boolean; }
export interface GalleryItem { id: string; src: string; alt?: string | null; caption?: string | null; category?: string | null; width?: number | null; height?: number | null; }
export interface Article { id: string; slug: string; title: string; date?: string | null; image?: string | null; tags?: string[]; excerpt?: string | null; body?: string[]; }
export interface EventItem { id: string; title: string; date?: string | null; time?: string | null; venue?: string | null; city?: string | null; country?: string | null; poster?: string | null; ticketPrice?: string | null; ticketUrl?: string | null; status: 'upcoming' | 'past' | 'cancelled'; recapVideoId?: string | null; description?: string | null; }
export interface Product { id: string; slug: string; name: string; description?: string | null; priceCents: number; currency: string; images?: string[]; sizes?: string[]; colors?: string[]; inventory?: number; active?: boolean; }
export interface Social { platform: string; url: string; handle?: string; }
export interface Profile {
  name: string; shortName: string; tagline: string; location: string; genre: string; bio: string[];
  portrait: string; heroImage: string; socials: Social[]; streaming: Social[];
  contactEmail?: string | null; bookingEmail?: string | null; pressEmail?: string | null;
  brand: { bg: string; surface: string; text: string; muted: string; accent: string; accent2: string };
  seo: { title: string; description: string };
}
export interface Content { profile: Profile; releases: Release[]; videos: Video[]; gallery: GalleryItem[]; news: Article[]; events: EventItem[]; products: Product[]; }
export interface Inquiry { id: string; createdAt: string; name: string; email: string; category: string; subject: string; message: string; status: string; }
export interface Subscriber { id: string; email: string; createdAt: string; status: string; source?: string; }
export interface Order { id: string; createdAt: string; customer: { name: string; email: string; phone?: string; address?: string }; items: { productId: string; name: string; priceCents: number; qty: number; size?: string; color?: string }[]; totalCents: number; currency: string; status: string; demo: boolean; }
export interface AdminData extends Content { inquiries: Inquiry[]; subscribers: Subscriber[]; orders: Order[]; }

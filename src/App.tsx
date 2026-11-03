import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ContentProvider, useContent } from './lib/content';
import { PlayerProvider } from './lib/player';
import { CartProvider } from './lib/cart';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';
import { Loader, ErrorState } from './components/ui';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Music = lazy(() => import('./pages/Music'));
const ReleaseDetail = lazy(() => import('./pages/ReleaseDetail'));
const Videos = lazy(() => import('./pages/Videos'));
const Events = lazy(() => import('./pages/Events'));
const Gallery = lazy(() => import('./pages/Gallery'));
const News = lazy(() => import('./pages/News'));
const Article = lazy(() => import('./pages/Article'));
const Contact = lazy(() => import('./pages/Contact'));
const Store = lazy(() => import('./pages/Store'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Legal').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Legal').then(m => ({ default: m.Terms })));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const CollectionAdmin = lazy(() => import('./pages/admin/CollectionAdmin'));
const ProfileAdmin = lazy(() => import('./pages/admin/ProfileAdmin'));
const RecordsAdmin = lazy(() => import('./pages/admin/RecordsAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));

function ScrollToTop() { const { pathname, hash } = useLocation(); useEffect(() => { if (hash) { const el = document.querySelector(hash); if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; } } window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname, hash]); return null; }
function Site() {
  const { content, loading, error, refresh } = useContent();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  if (isAdmin) return <Suspense fallback={<Loader label="Loading admin" />}><Routes><Route path="/admin" element={<AdminApp />}><Route index element={<Dashboard />} /><Route path="profile" element={<ProfileAdmin />} /><Route path="settings" element={<SettingsAdmin />} /><Route path="inquiries" element={<RecordsAdmin collection="inquiries" />} /><Route path="subscribers" element={<RecordsAdmin collection="subscribers" />} /><Route path="orders" element={<RecordsAdmin collection="orders" />} /><Route path=":collection" element={<CollectionAdmin />} /></Route></Routes></Suspense>;
  if (loading) return <Loader label="Loading RANO" />;
  if (error || !content) return <ErrorState message={error || 'Content unavailable'} onRetry={refresh} />;
  return (<>
    <Header />
    <main id="main"><Suspense fallback={<Loader />}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/music" element={<Music />} />
      <Route path="/music/:slug" element={<ReleaseDetail />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/events" element={<Events />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:slug" element={<Article />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/store" element={<Store />} />
      <Route path="/store/:slug" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order/:id" element={<OrderConfirmation />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense></main>
    <Footer />
    <AudioPlayer />
  </>);
}
export default function App() {
  return (
    <BrowserRouter>
      <ContentProvider><PlayerProvider><CartProvider>
        <ScrollToTop />
        <Site />
      </CartProvider></PlayerProvider></ContentProvider>
    </BrowserRouter>
  );
}

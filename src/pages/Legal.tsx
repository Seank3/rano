import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/hooks';
export function Privacy() {
  usePageMeta('Privacy Policy — RANO');
  return <Legal title="Privacy Policy" word="Privacy" sections={[
    ['What we collect', 'When you use the contact form we store your name, email address, inquiry category, subject and message. When you join the newsletter we store your email address. Demo store orders store the name, email, optional phone and delivery details you provide. We do not collect payment card details.'],
    ['Why we collect it', 'To respond to booking, press, business and collaboration inquiries; to send release and show announcements you opted into; and to review merchandise interest.'],
    ['How it is stored', 'Submissions are stored in the website\'s private database and are visible only to authorised administrators. They are not sold or shared with third parties.'],
    ['Third-party services', 'Music previews are served by Apple Music and videos are embedded from YouTube. Those providers may set their own cookies or collect usage data under their own privacy policies when you play media. Social links open the respective platforms.'],
    ['Your choices', 'You can unsubscribe from the newsletter at any time by contacting the team through the contact form. You may request deletion of your submissions the same way.'],
    ['Contact', 'For privacy questions, use the contact form on this website and select "General message".'],
  ]} />;
}
export function Terms() {
  usePageMeta('Terms & Conditions — RANO');
  return <Legal title="Terms & Conditions" word="Terms" sections={[
    ['Use of this website', 'This is the official website of Ugakid RANO. Content is provided for information and entertainment. You may browse, listen to previews and watch embedded videos for personal, non-commercial use.'],
    ['Intellectual property', 'All music, artwork, video, photography, text and trademarks belong to Ugakid RANO and the respective credited creators. You may not reproduce, distribute or exploit any content without written permission.'],
    ['Music previews & embeds', 'Audio previews are provided by Apple Music and remain the property of the rights holders. Videos are embedded from YouTube. Availability may change without notice.'],
    ['Merchandise & demo checkout', 'Until a payment provider is connected, checkout operates in demonstration mode: orders are recorded for review only and no payment is processed. Product availability, pricing and shipping will be confirmed by the team before any real sale.'],
    ['User submissions', 'By sending a message you confirm the information is accurate and that you have the right to share it. Do not submit unlawful, abusive or infringing content.'],
    ['Liability', 'The website is provided "as is". We are not liable for interruptions, third-party platform changes, or losses arising from reliance on information here. Event dates and ticket links are only published when confirmed.'],
    ['Changes', 'These terms may be updated. Continued use of the site after changes means you accept the updated terms.'],
  ]} />;
}
function Legal({ title, word, sections }: { title: string; word: string; sections: [string, string][] }) {
  return (<><div className="page-hero" data-word={word}><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>{title}</span></div><h1 className="display h2">{title}</h1><p className="lead">Last updated: November 2026</p></div></div><section className="section"><div className="container article">{sections.map(([h, b]) => <div key={h} style={{ marginBottom: 36 }}><h2 className="display h4" style={{ marginBottom: 12 }}>{h}</h2><p className="muted" style={{ fontSize: 17, lineHeight: 1.8, margin: 0 }}>{b}</p></div>)}<Link to="/" className="link-arrow">Back home</Link></div></section></>);
}

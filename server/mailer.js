/**
 * Optional email delivery stub.
 * Submissions are always stored in SQLite. To ALSO send email notifications,
 * implement sendMail() with your provider and call it from the contact/newsletter
 * handlers in server/index.js. Keep credentials in environment variables only.
 *
 * Example (Resend):  npm i resend
 *   import { Resend } from 'resend';
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({ from: 'site@your-domain.com', to: process.env.MAIL_TO, subject, text });
 */
export async function sendMail({ to, subject, text }) {
  if (!process.env.MAIL_TO) return { skipped: true, reason: 'MAIL_TO not configured' };
  // TODO: integrate your provider here. Never log credentials.
  console.log(`[mailer] (not configured) would email ${to}: ${subject}`);
  return { skipped: true, reason: 'No email provider configured' };
}

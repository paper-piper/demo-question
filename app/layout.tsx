import type { Metadata, Viewport } from 'next';
import { Rubik, Heebo } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-rubik',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'דמוקרטי לב השרון מהלכה למעשה',
  description: 'לומדה לחברי קהילת בית הספר',
};

/* Phones are the primary device for this module. `viewportFit: 'cover'` lets the
   sticky bars reach the bottom of the screen; the safe-area insets in
   globals.css keep them clear of the home indicator. Zooming stays enabled. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4efe8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${heebo.variable}`}>
      <body>{children}</body>
    </html>
  );
}

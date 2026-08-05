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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4f1ec',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${heebo.variable}`}>
      <body>{children}</body>
    </html>
  );
}

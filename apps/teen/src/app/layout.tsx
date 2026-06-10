import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Я Є',
  description: 'простір, поки знайдеш живу людину',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Я Є',
  },
};

export const viewport: Viewport = {
  themeColor: '#F5EFE4',
  width: 'device-width',
  initialScale: 1,
  // Не блокуємо pinch-to-zoom — це accessibility-вимога для людей зі
  // слабким зором (WCAG 1.4.4). Раніше було maximumScale: 1 — прибрано.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}

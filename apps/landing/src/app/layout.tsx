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
  title: 'Я Є · простір, щоб почути себе',
  description:
    'Розмова, що допомагає почути себе — у методологічній рамці. Зроблено так, щоб ти пішов з ясністю, а не залишився.',
};

export const viewport: Viewport = {
  themeColor: '#F5EFE4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}

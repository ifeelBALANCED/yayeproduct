import withPWA from '@ducanh2912/next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// CSP формується залежно від середовища.
// У dev дозволено unsafe-eval (Next.js hot-reload), у production — ні.
// unsafe-inline для script-src потрібен Next.js inline-скриптам (без nonce).
const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
]
  .join('; ')
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ya-ye/ui', '@ya-ye/method', '@ya-ye/db'],
  typedRoutes: true,
  // Включити docs/ у serverless bundle — потрібно для readFileSync у system-prompt
  outputFileTracingIncludes: {
    '/api/chat': ['../../docs/**/*'],
  },
  async headers() {
    return [
      {
        // Застосовуємо до всіх маршрутів.
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

// quality-gate §3 S7: SW не повинен кешувати /api/* (включно з SSE-стрімом /api/chat).
// extendDefaultRuntimeCaching: true — дозволяє перевизначити дефолтне правило за cacheName.
// Запис з cacheName:"apis" замінює дефолтний NetworkFirst → NetworkOnly (без кешу).
// buildExcludes: виключаємо /_next/static/chunks/app/api/**  — це серверні route-бандли
// Next.js App Router, вони не є реальними URL-ендпоінтами і не повинні потрапляти
// до precache-маніфесту (інакше SW намагається prefetch неіснуючих URL).
const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    // Виключаємо серверні route-бандли App Router з precache-маніфесту.
    // workbox GenerateSW.exclude порівнює з іменами webpack-чанків (без /_next/),
    // тому паттерн без провідного слешу: static/chunks/app/api/**/*.js
    exclude: [/static\/chunks\/app\/api\//],
    runtimeCaching: [
      {
        // Перевизначаємо дефолтне правило cacheName:"apis" → NetworkOnly.
        // Причина: /api/* містить SSE-стрім (/api/chat) і мутуючі ендпоінти —
        // кешування GET-відповідей порушує коректність даних (quality-gate §3 S7).
        urlPattern: ({ sameOrigin, url: { pathname } }) =>
          sameOrigin && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/callback'),
        handler: 'NetworkOnly',
        options: {
          cacheName: 'apis',
        },
      },
    ],
  },
});

export default withNextIntl(withPWAConfig(nextConfig));

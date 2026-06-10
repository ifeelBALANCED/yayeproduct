import withPWA from '@ducanh2912/next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ya-ye/ui', '@ya-ye/method', '@ya-ye/db'],
  typedRoutes: true,
  // Включити docs/ у serverless bundle — потрібно для readFileSync у system-prompt
  outputFileTracingIncludes: {
    '/api/chat': ['../../docs/**/*'],
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

export default withNextIntl(withPWAConfig(nextConfig));

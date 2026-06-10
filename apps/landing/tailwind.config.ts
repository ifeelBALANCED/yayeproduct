import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F5EFE4',
        bgSoft: '#EDE5D6',
        ink: '#1F1B16',
        inkSoft: '#5A5347',
        accent: '#C28160',
        accentSoft: '#D9A989',
        crisis: '#A8331E',
        crisisSoft: '#F0D5CD',
        ok: '#6B8E5A',
        divider: '#D9D0BD',
        // Island layers — Demo Day sprint v2.1
        'island-foundation': '#A8B89A',
        'island-bay':        '#D9A989',
        'island-rock':       '#C2A878',
        'island-lighthouse': '#E8D5B7',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;

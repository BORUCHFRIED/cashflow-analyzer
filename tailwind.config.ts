import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
      },
      boxShadow: {
        card:         '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10)',
      },
      animation: {
        skeleton:  'skeleton 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up':'slideUp 0.18s ease-out',
      },
      keyframes: {
        skeleton: {
          '0%, 100%': { opacity: '1'    },
          '50%':       { opacity: '0.4' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
      },
    },
  },
  plugins: [],
};

export default config;

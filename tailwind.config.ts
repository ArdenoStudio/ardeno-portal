import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#E50914',
          hover: '#B20710',
          glow: 'rgba(229, 9, 20, 0.5)',
        },
        surface: {
          DEFAULT: '#000000',
          card: 'rgba(10, 10, 12, 0.45)',
          'card-hover': 'rgba(15, 15, 18, 0.65)',
          modal: '#050505',
        },
        zinc: {
          850: '#1f1f22',
          950: '#09090b',
        },
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

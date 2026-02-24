import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#ff3301',
          hover: '#d92b00',
          glow: 'rgba(255, 51, 1, 0.5)',
        },
        surface: {
          DEFAULT: '#0a0a0c',
          card: 'rgba(12, 12, 14, 0.55)',
          'card-hover': 'rgba(18, 18, 22, 0.8)',
          modal: '#141416',
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

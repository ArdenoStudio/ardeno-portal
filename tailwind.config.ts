import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'hero': ['var(--text-hero)', { lineHeight: '0.9', letterSpacing: '-0.03em' }],
        'display': ['var(--text-display)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'title': ['var(--text-title)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'caption': ['var(--text-caption)', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        background: {
          DEFAULT: 'var(--bg-0)',
          elevated: 'var(--bg-1)',
          surface: 'var(--bg-2)',
        },
        accent: {
          DEFAULT: 'var(--accent-0)',
          'tier-2': 'var(--accent-1)',
          'tier-3': '#8A1A0F',
          glow: 'var(--accent-veil)',
        },
        text: {
          primary: 'var(--text-0)',
          secondary: 'var(--text-1)',
          metadata: 'var(--text-2)',
        },
        border: {
          subtle: 'var(--border-0)',
          premium: 'var(--border-1)',
        },
        surface: {
          DEFAULT: 'var(--bg-0)',
          card: 'rgba(10, 10, 12, 0.45)',
          'card-hover': 'rgba(5, 5, 7, 0.85)',
          modal: 'var(--bg-1)',
        },
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        pill: 'var(--r-pill)',
      },
      transitionTimingFunction: {
        cinematic: 'var(--ease-cinematic)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'shimmer': 'shimmer 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.995' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
    },
  },
  plugins: [],
} satisfies Config;

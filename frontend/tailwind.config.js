/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          void: '#07090e',
          base: '#0b0e17',
        },
        surface: {
          card: '#111622',
          hover: '#182030',
          popover: '#1f293d',
        },
        lunar: {
          cyan: '#38bdf8',
          deep: '#0284c7',
          silver: '#e2e8f0',
          basalt: '#475569',
        },
        martian: {
          rust: '#f97316',
          oxide: '#ea580c',
          basalt: '#7c2d12',
          gold: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.08)' },
        },
      },
      animation: {
        'space-shimmer': 'shimmer 1.8s infinite linear',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}

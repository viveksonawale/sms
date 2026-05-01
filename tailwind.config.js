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
        primary:       '#00a76f',
        'primary-hover': '#007867',
        'primary-tint':  'rgba(0, 167, 111, 0.1)',
        secondary:     '#637381',
        tertiary:      '#556EE6',
        neutral:       '#454f5b',
        background:    '#F9FAFB',
        surface:       '#FFFFFF',
        'dark-bg':     '#141a21',
        'dark-surface': '#1c252e',
        'dark-border': '#34334a',
        success:       '#22c55e',
        warning:       '#ffab00',
        danger:        '#ff5630',
        info:          '#00b8d9',
        'sidebar-bg':  '#1c252e',
        'sidebar-hover': 'rgba(255, 255, 255, 0.04)',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      opacity: {
        '4':  '0.04',
        '6':  '0.06',
        '8':  '0.08',
        '15': '0.15',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}

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
        // 🔶 Primary Orange Theme (Saffron Inspired)
        primary:        '#f97316',   // main orange
        'primary-hover':'#ea580c',   // darker orange
        'primary-tint': 'rgba(249, 115, 22, 0.1)',

        // 🔸 Supporting Colors
        secondary:      '#6b7280',   // neutral gray
        tertiary:       '#f59e0b',   // amber/gold accent

        // 🔹 Neutral System
        neutral:        '#374151',
        background:     '#FFF7ED',   // warm light background
        surface:        '#FFFFFF',

        // 🌙 Dark Mode (warm dark tone)
        'dark-bg':      '#1a120b',
        'dark-surface': '#24170e',
        'dark-border':  '#3b2a1a',

        // 🔔 Status Colors (slightly tuned for orange theme)
        success:        '#22c55e',
        warning:        '#f59e0b',
        danger:         '#ef4444',
        info:           '#0ea5e9',

        // 🧭 Sidebar (dark warm tone)
        'sidebar-bg':   '#24170e',
        'sidebar-hover':'rgba(255, 255, 255, 0.05)',
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

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   darkMode: 'class',
//   theme: {
//     extend: {
//       colors: {
//         primary:       '#00a76f',
//         'primary-hover': '#007867',
//         'primary-tint':  'rgba(0, 167, 111, 0.1)',
//         secondary:     '#637381',
//         tertiary:      '#556EE6',
//         neutral:       '#454f5b',
//         background:    '#F9FAFB',
//         surface:       '#FFFFFF',
//         'dark-bg':     '#141a21',
//         'dark-surface': '#1c252e',
//         'dark-border': '#34334a',
//         success:       '#22c55e',
//         warning:       '#ffab00',
//         danger:        '#ff5630',
//         info:          '#00b8d9',
//         'sidebar-bg':  '#1c252e',
//         'sidebar-hover': 'rgba(255, 255, 255, 0.04)',
//       },
//       fontFamily: {
//         sans: ['"Public Sans"', 'sans-serif'],
//         mono: ['Courier New', 'monospace'],
//       },
//       borderWidth: {
//         DEFAULT: '1px',
//       },
//       opacity: {
//         '4':  '0.04',
//         '6':  '0.06',
//         '8':  '0.08',
//         '15': '0.15',
//       },
//       keyframes: {
//         shimmer: {
//           from: { backgroundPosition: '-200% 0' },
//           to:   { backgroundPosition: '200% 0' },
//         },
//       },
//       animation: {
//         shimmer: 'shimmer 1.5s linear infinite',
//       },
//     },
//   },
//   plugins: [],
// }

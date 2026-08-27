import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        villagio: {
          green: '#184037',
          'green-light': '#23594e',
          'green-dark': '#0f2923',
          orange: '#ed7423',
          'orange-hover': '#db6314',
          'orange-light': '#fff4ed',
          peach: '#f6b787',
          'peach-light': '#fdf2e9',
          canvas: '#F8F9FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 15px -3px rgba(24, 64, 55, 0.08), 0 4px 6px -2px rgba(24, 64, 55, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;

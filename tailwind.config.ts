import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF8C00',
          hover: '#E07B00',
          light: '#FFF4E6',
          dark: '#CC7000',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAFAFA',
          muted: '#F4F4F5',
        },
        border: {
          DEFAULT: '#E5E5E5',
          light: '#F0F0F0',
        },
        primary: {
          DEFAULT: '#111111',
          muted: '#666666',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;

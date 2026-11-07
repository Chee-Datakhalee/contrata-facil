import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F6F3FF',
          100: '#EDE8FF',
          200: '#DDD3FF',
          300: '#C2B0FA',
          500: '#6D3FE0',
          600: '#5B2FCB',
          700: '#4A22AE',
          800: '#3B1A8F',
          900: '#2A1070',
        },
        accent: { DEFAULT: '#F7A12B', dark: '#E88C0F' },
        ink: '#1E1B3A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

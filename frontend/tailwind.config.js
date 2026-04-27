/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          light: '#4ade80',
          dark: '#15803d',
        },
        success: {
          DEFAULT: '#16a34a',
          bg: '#f0fdf4',
        },
        warning: {
          DEFAULT: '#eab308',
          bg: '#fef9c3',
        },
        danger: {
          DEFAULT: '#ef4444',
          bg: '#fef2f2',
        },
        fi: {
          DEFAULT: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}

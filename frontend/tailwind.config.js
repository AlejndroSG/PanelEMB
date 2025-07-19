/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'emb': {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc3fd',
          400: '#3aa3fa',
          500: '#1586f0',
          600: '#0068e1',
          700: '#0154b6',
          800: '#014695',
          900: '#073e7c',
          950: '#042854',
        },
      }
    },
  },
  plugins: [],
}

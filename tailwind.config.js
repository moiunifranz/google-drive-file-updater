/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          'blue-hover': '#1557b0',
          'blue-light': '#e8f0fe',
          red: '#d93025',
          'red-light': '#fce8e6',
          green: '#188038',
          'green-light': '#e6f4ea',
          yellow: '#f29900',
          'yellow-light': '#fef7e0',
          gray: '#5f6368',
          'gray-light': '#f1f3f4',
          'border': '#dadce0',
        }
      }
    },
  },
  plugins: [],
}

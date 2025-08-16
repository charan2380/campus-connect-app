// In tailwind.config.js
/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme' // Import default theme

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // THIS IS THE CHANGE
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
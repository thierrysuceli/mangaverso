/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1e1e1e',
        accent: {
          DEFAULT: '#9d00ff',
          dark: '#7b00c7'
        },
        text: {
          primary: '#f4f4f4',
          secondary: '#a0a0a0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

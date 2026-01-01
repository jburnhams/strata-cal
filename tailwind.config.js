/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
      },
      fontFamily: {
        handwriting: ['Dancing Script', 'cursive'],
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        display: ['Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

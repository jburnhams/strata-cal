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
        serif: ['Playfair Display', 'serif'],
        display: ['Oswald', 'sans-serif'],
        // Explicitly set sans to Inter to match the body font and typical UI expectations
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

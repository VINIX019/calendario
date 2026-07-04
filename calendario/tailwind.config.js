/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#faf6f0',
        ink: '#2b2622',
        muted: '#7a6f66',
        line: '#e6ddd2',
        terracotta: '#c26b4a',
        teal: '#4a8c86',
      },
    },
  },
  plugins: [],
};

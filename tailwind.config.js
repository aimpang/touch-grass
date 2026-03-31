/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111118',
        panel: 'rgba(18, 18, 28, 0.92)',
      },
    },
  },
  plugins: [],
}

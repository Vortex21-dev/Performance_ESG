/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'xs': ['1rem', { lineHeight: '1.4' }],
        'sm': ['1rem', { lineHeight: '1.5' }],
        'base': ['1.1rem', { lineHeight: '1.6' }],
        'lg': ['1.1rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.6rem', { lineHeight: '1.5' }],
        '3xl': ['2.3rem', { lineHeight: '1.4' }],
        '4xl': ['2.7rem', { lineHeight: '1.3' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
};

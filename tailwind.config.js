/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#1E3A4C', light: '#2A5068', dark: '#142635' },
        gold:  { DEFAULT: '#C9A84C', light: '#D9BC76', dark: '#A8872E' },
        cream: { DEFAULT: '#F9F5EE', dark: '#EDE7DC' },
        sage:  { DEFAULT: '#5B7B5A', light: '#7A9C79' },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 8px rgba(30,58,76,0.08)',
        modal: '0 8px 40px rgba(30,58,76,0.18)',
      },
    },
  },
  plugins: [],
};

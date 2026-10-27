/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Рукописный шрифт для подписей на полароидах (Caveat подключён через @fontsource, лежит внутри сайта)
        handwritten: ['Caveat', 'Segoe Script', 'Bradley Hand', 'cursive'],
      },
      boxShadow: {
        // Выпуклый неоморфизм
        neu: '10px 10px 22px rgba(214, 150, 165, 0.35), -10px -10px 22px rgba(255, 255, 255, 0.95)',
        'neu-sm': '5px 5px 12px rgba(214, 150, 165, 0.3), -5px -5px 12px rgba(255, 255, 255, 0.95)',
        // Вдавленный неоморфизм
        'neu-in': 'inset 4px 4px 10px rgba(214, 150, 165, 0.35), inset -4px -4px 10px rgba(255, 255, 255, 0.9)',
      },
    },
  },
  plugins: [],
};
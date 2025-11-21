/** @type {import('tailwindcss').Config} */
export default {
   content: [
      './index.html',
      './index.tsx',
      './App.tsx',
      './components/**/*.{js,ts,jsx,tsx}',
   ],
   darkMode: 'class',
   theme: {
      extend: {
         fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Merriweather', 'serif'],
         },
         colors: {
            glass: {
               100: 'rgba(255, 255, 255, 0.1)',
               200: 'rgba(255, 255, 255, 0.2)',
               border: 'rgba(255, 255, 255, 0.1)',
            },
         },
         animation: {
            'fade-in': 'fadeIn 0.5s ease-out',
            'spin-slow': 'spin 3s linear infinite',
         },
         keyframes: {
            fadeIn: {
               '0%': { opacity: '0', transform: 'translateY(10px)' },
               '100%': { opacity: '1', transform: 'translateY(0)' },
            },
         },
      },
   },
   plugins: [],
};

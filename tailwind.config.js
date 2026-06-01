/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070A12',
        panel: '#0E1422',
        panel2: '#121B2D',
        panel3: '#172238',
        line: '#26334F',
        muted: '#95A3BE',
        brand: '#36A9FF',
        aqua: '#32D6E8',
        success: '#30D98A',
        warning: '#F4C95D',
        danger: '#FF6B78',
        violet: '#9B61FF',
      },
      boxShadow: {
        soft: '0 20px 55px rgba(0,0,0,0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

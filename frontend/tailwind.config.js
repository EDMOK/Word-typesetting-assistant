/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'Source Han Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        handwritten: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-hover': '0 12px 40px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'glow': '0 0 12px rgba(59, 130, 246, 0.2)',
        'glow-lg': '0 0 24px rgba(59, 130, 246, 0.25)',
        'button': '0 4px 16px rgba(59, 130, 246, 0.2)',
        'button-hover': '0 6px 20px rgba(59, 130, 246, 0.35)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: { cyan: '#00f5ff', purple: '#7c3aed', pink: '#f0abfc', green: '#00ff88' },
        dark: { bg: '#050510', card: '#0a0a1a', border: '#1a1a3a' }
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'spin-medium': 'spin 4s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%,100%': { boxShadow: '0 0 20px #00f5ff44, 0 0 40px #00f5ff22' },
          '50%': { boxShadow: '0 0 60px #00f5ffaa, 0 0 100px #00f5ff44' }
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' }
        },
      }
    }
  },
  plugins: []
}


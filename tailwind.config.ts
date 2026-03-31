import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f4f0',
          100: '#cce9e0',
          200: '#99d3c1',
          300: '#66bda2',
          400: '#33a783',
          500: '#0F6E56',  // Primary teal
          600: '#0c5844',
          700: '#094232',
          800: '#062c21',
          900: '#031611',
        },
        amber: {
          50: '#fef9ee',
          100: '#fdf3dc',
          200: '#fbe7b9',
          300: '#f9db96',
          400: '#f7cf73',
          500: '#BA7517',  // Secondary amber
          600: '#955e12',
          700: '#70460e',
          800: '#4a2f09',
          900: '#251705',
        },
        accent: {
          50: '#efeefc',
          100: '#deddf9',
          200: '#bdbaf3',
          300: '#9c98ec',
          400: '#7b75e6',
          500: '#534AB7',  // Accent purple
          600: '#423b92',
          700: '#322c6e',
          800: '#211d49',
          900: '#110f25',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm parchment backgrounds
        cream: {
          50:  '#FDFAF4',
          100: '#F6F1EA',   // page bg
          200: '#EDE4D4',
          300: '#E2D5BE',
          400: '#D4C4A8',
          500: '#BFB39E',
          600: '#A69880',
          700: '#877A63',
          800: '#5C5244',
          900: '#2C2820',
        },
        // Muted sage / olive green — primary
        sage: {
          50:  '#F2F5F0',
          100: '#E0EAD9',
          200: '#C1D4B4',
          300: '#9DBA8A',
          400: '#7A9E63',
          500: '#567C45',   // primary action
          600: '#436036',
          700: '#334928',
          800: '#22301A',
          900: '#11180D',
        },
        // Warm terracotta — secondary accent
        terra: {
          50:  '#FBF2EC',
          100: '#F5E1D2',
          200: '#EBC3A5',
          300: '#DEA278',
          400: '#CE7F4D',
          500: '#A86030',   // secondary
          600: '#864D26',
          700: '#633A1C',
          800: '#422612',
          900: '#211308',
        },
        // Warm stone — neutrals
        sand: {
          50:  '#FDFAF4',
          100: '#F6F1EA',
          200: '#EDE4D4',
          300: '#DDD0BC',
          400: '#C8BAA0',
          500: '#ADA082',
          600: '#8C8062',
          700: '#696047',
          800: '#463F2E',
          900: '#232017',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgba(44,40,32,0.06), 0 1px 2px -1px rgba(44,40,32,0.04)',
        'card-md': '0 4px 16px 0 rgba(44,40,32,0.09), 0 2px 4px -1px rgba(44,40,32,0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

export default config

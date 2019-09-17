const { boxShadow } = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    extend: {
      colors: {
        // TODO: See if we can use hsl colours here
        black: '#27241D',
        gray: {
          100: '#FAF9F7',
          200: '#E8E6E1',
          300: '#D3CEC4',
          400: '#B8B2A7',
          500: '#A39E93',
          600: '#857F72',
          700: '#625D52',
          800: '#504A40',
          900: '#423D33',
        },
        orange: {
          50: 'hsl(24, 100%, 95%)',
          100: 'hsl(24, 100%, 93%)',
          200: '#FFD0B5',
          300: '#FFB088',
          400: '#FF9466',
          500: '#F9703E',
          600: '#F35627',
          700: '#DE3A11',
          800: '#C52707',
          900: '#AD1D07',
          1000: '#841003',
        },
      },
      spacing: {
        px: '1px',
        '0': '0',
        '1': '2px',
        '2': '4px',
        '3': '6px',
        '4': '8px',
        '5': '10px',
        '6': '12px',
        '8': '16px',
        '10': '20px',
        '12': '24px',
        '16': '32px',
        '20': '40px',
        '24': '48px',
        '32': '64px',
        '40': '80px',
        '48': '96px',
        '56': '112px',
        '64': '128px',
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        default: '8px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        ...boxShadow,
        'orange-default':
          '0 1px 1px -1px hsl(6, 59%, 75%), 0 2px 4px -1px hsla(6, 59%, 75%, 0.5)',
      },
      fontFamily: {
        // TODO: See if we can have a different set for ja vs en
        sans: [
          'Roboto',
          'Noto Sans Japanese',
          'ヒラギノ角ゴ Pro W3',
          'Hiragino Kaku Gothic Pro',
          'メイリオ',
          'Meiryo',
          'Osaka',
          'ＭＳ Ｐゴシック',
          'MS PGothic',
          'sans-serif',
        ],
      },
    },
  },
  variants: {
    textColor: ['responsive', 'hover', 'focus', 'visited'],
  },
  plugins: [],
};

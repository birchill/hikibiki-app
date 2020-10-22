const { boxShadow, fontSize, margin } = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    extend: {
      colors: {
        // TODO: See if we can use hsl colours here
        black: '#27241D',
        gray: {
          100: 'hsl(40, 23.1%, 97.5%)',
          200: 'hsl(42.9, 13.2%, 89.6%)',
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
        0: '0',
        1: '0.125rem',
        2: '0.25rem',
        3: '0.375rem',
        4: '0.5rem',
        5: '0.625rem',
        6: '0.75rem',
        8: '1rem',
        10: '1.25rem',
        12: '1.5rem',
        16: '2rem',
        20: '2.5rem',
        24: '3rem',
        32: '4rem',
        40: '5rem',
        48: '6rem',
        56: '7rem',
        64: '8rem',
      },
      inset: {
        32: '4rem',
        64: '8rem',
        '-32': '-4rem',
        '-64': '-8rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        default: '0.5rem',
        lg: '1rem',
        full: '9999px',
      },
      boxShadow: {
        ...boxShadow,
        'orange-default':
          '0 1px 1px -1px hsl(6, 59%, 75%), 0 2px 4px -1px hsla(6, 59%, 75%, 0.5)',
        'search-default': '2px 4px 3px hsla(8, 92.2%, 22%, 10%)',
      },
      fontFamily: {
        // TODO: See if we can have a different set for ja vs en
        sans: [
          'Roboto',
          'Noto Sans Japanese',
          'Segoe UI',
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
      fontSize: {
        ...fontSize,
        kanjixl: '6rem',
      },
      gridTemplateColumns: {
        seealso: '3em minmax(50px, max-content) minmax(120px, max-content)',
      },
      margin: {
        ...margin,
        '-half-input-text-2xl-py-6': `calc(-1 * (1.5 * 0.5 * ${fontSize['2xl']} + 12px))`,
      },
    },
  },
  variants: {
    textColor: ['responsive', 'hover', 'focus', 'visited'],
    borderColor: [
      'responsive',
      'hover',
      'focus',
      'focus-within',
      'focus-invisible',
    ],
  },
  plugins: [
    function ({ addVariant, e }) {
      addVariant('focus-invisible', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(
            `focus-invisible${separator}${className}`
          )}:focus:not(:focus-visible)`;
        });
      });
    },
  ],
  // Silence warning since we run PurgeCSS in separate postcss step
  purge: false,
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
    standardFontWeights: true,
    defaultLineHeights: true,
  },
};

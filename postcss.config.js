/* eslint-env node */
/* eslint @typescript-eslint/no-var-requires: 0 */

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    ...(process.env.NODE_ENV === 'production'
      ? [require('cssnano')({ preset: 'default' })]
      : []),
    require('autoprefixer'),
  ],
};

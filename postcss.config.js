const path = require('path');

const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    path.join(__dirname, 'src', 'index.html'),
    path.join(__dirname, 'src', 'components', '*.tsx'),
  ],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
});

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    ...(process.env.NODE_ENV === 'production' ? [purgecss] : []),
  ],
};

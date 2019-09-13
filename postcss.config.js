const path = require('path');

const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [path.join(__dirname, 'src', 'components', '*.jsx')],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
});

module.exports = {
  plugins: [
    require('tailwindcss'),
    ...(process.env.NODE_ENV === 'production' ? [purgecss] : []),
  ],
};

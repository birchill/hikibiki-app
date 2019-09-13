const path = require('path');

module.exports = ({ config, mode }) => {
  // TypeScript
  config.module.rules.push({
    test: /\.tsx?$/,
    use: 'ts-loader',
    include: path.resolve(__dirname, '../src'),
  });
  config.resolve.extensions.push('.ts', '.tsx');

  // CSS
  config.module.rules.push({
    test: /\.css?$/,
    include: path.resolve(__dirname, '../src'),
    use: [
      {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          plugins: [require('tailwindcss')],
        },
      },
    ],
  });

  return config;
};

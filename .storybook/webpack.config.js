const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  });
  config.plugins.push(new MiniCssExtractPlugin({ filename: 'storybook.css' }));

  return config;
};

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  addons: [
    {
      name: '@storybook/addon-postcss',
      options: {
        cssLoaderOptions: {
          url: false,
          importLoaders: 1,
        },
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  core: {
    builder: 'webpack5',
  },
  framework: '@storybook/preact',
  staticDirs: ['../dist'],
  stories: ['../src/components/**/*.stories.tsx'],
  webpackFinal: async (config) => {
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
    });

    return config;
  },
};

const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { RelativeCiAgentWebpackPlugin } = require('@relative-ci/agent');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

const plugins = [
  new CleanWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [
      { from: 'img/*', to: '[name].[ext]' },
      { from: 'src/manifest.webmanifest', to: 'manifest.webmanifest' },
      { from: '_headers' },
    ],
  }),
  new HtmlWebpackPlugin({
    template: './src/index.html',
    excludeChunks: ['db-worker'],
  }),
  new MiniCssExtractPlugin({ filename: 'hikibiki.[contenthash].css' }),
];

// Don't run the Relative CI task unless we mean to -- it corrupts the stats
// file so other tools can't use it.
if (process.env.RELATIVE_CI_KEY) {
  plugins.push(new RelativeCiAgentWebpackPlugin());
}

module.exports = {
  entry: {
    hikibiki: ['./src/main.tsx'],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    // Although this path is the default, it is needed by clean-webpack-plugin
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css?$/,
        exclude: /node_modules/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              url: false,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
    ],
  },
  plugins,
  mode,
  optimization: {
    splitChunks: {
      minChunks: 2,
    },
  },
  devtool: prod ? false : 'source-map',
};

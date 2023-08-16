const path = require('path');
const crypto = require('crypto');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { RelativeCiAgentWebpackPlugin } = require('@relative-ci/agent');
const { InjectManifest } = require('workbox-webpack-plugin');
const webpack = require('webpack');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

const plugins = [
  new webpack.DefinePlugin({
    __BUILD_ID__: `'${getUniqueBuildId()}'`,
  }),
  new CleanWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [
      { from: 'img/*', to: '[name][ext]' },
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

if (mode !== 'development') {
  plugins.push(
    new InjectManifest({
      swSrc: './src/sw.ts',
      exclude: ['_headers'],
    })
  );
}

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
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
    },
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
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
  },
};

function getUniqueBuildId() {
  const EPOCH_START = Date.UTC(2020, 0, 1);
  const RANDOM_COMPONENT_LENGTH = 8;

  const timeStamp = Date.now() - EPOCH_START;

  // Random component
  const buffer = new Uint8Array(RANDOM_COMPONENT_LENGTH);
  crypto.randomFillSync(buffer);
  const max = Math.pow(2, 8);
  let randomComponent = 0;
  for (let i = 0; i < buffer.length; i++) {
    randomComponent *= 36;
    randomComponent += Math.round((buffer[i] / max) * 35);
  }

  return (
    // Take the timestamp, convert to base 36, and zero-pad it so it
    // collates correctly for at least 50 years...
    `0${timeStamp.toString(36)}`.slice(-8) +
    // ...then add the random component, also suitably zero-padded
    `${'0'.repeat(RANDOM_COMPONENT_LENGTH)}${randomComponent.toString(
      36
    )}`.slice(-RANDOM_COMPONENT_LENGTH)
  );
}

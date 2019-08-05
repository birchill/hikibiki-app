const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
  entry: {
    kanjichamp: ['./src/main.tsx'],
    'db-worker': ['./src/db-worker.ts'],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].js',
    chunkFilename: '[name].[id].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode,
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  devtool: prod ? false : 'source-map',
};

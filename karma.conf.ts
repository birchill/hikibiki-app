const path = require('path');

module.exports = config => {
  config.set({
    basePath: 'src',
    files: [{ pattern: '**/*.test.ts', watched: false }],
    preprocessors: {
      '*.test.ts': ['webpack'],
    },
    webpack: {
      mode: 'development',
      resolve: {
        extensions: ['.ts', '.js'],
      },
      resolveLoader: {
        modules: [path.join(__dirname, 'node_modules')],
      },
      module: {
        rules: [{ test: /\.ts$/, use: 'ts-loader' }],
      },
    },
    frameworks: ['mocha', 'chai'],
    browsers: ['Firefox', 'Chrome'],
    plugins: [
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-webpack'),
      require('karma-firefox-launcher'),
      require('karma-chrome-launcher'),
    ],
  });
};

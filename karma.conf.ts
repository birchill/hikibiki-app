const builtins = require('rollup-plugin-node-builtins');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');

module.exports = config => {
  config.set({
    basePath: 'src',
    files: [{ pattern: '**/*.test.ts', watched: false }],
    preprocessors: {
      '**/*.ts': ['rollup'],
    },
    rollupPreprocessor: {
      output: {
        sourcemap: 'inline',
        format: 'iife',
        name: 'kanjichamp',
      },
      plugins: [
        typescript(),
        // This is because fetch-mock depends on querystring somehow
        builtins(),
        resolve({ browser: true, preferBuiltins: true }),
        commonjs({
          namedExports: {
            chai: ['assert'],
          },
        }),
      ],
    },
    frameworks: ['mocha', 'chai'],
    browsers: ['FirefoxNightly'],
    plugins: [
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-rollup-preprocessor'),
      require('karma-firefox-launcher'),
    ],
  });
};

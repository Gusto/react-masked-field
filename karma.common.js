module.exports = {
  // base path that will be used to resolve all patterns (eg. files, exclude)
  basePath: '',

  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['mocha'],

  // list of files / patterns to load in the browser
  files: ['spec/**/*_spec.js*'],

  // preprocess matching files before serving them to the browser
  // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
  preprocessors: {
    'spec/**/*.js*': ['webpack']
  },

  browserify: {
    debug: true
  },

  webpack: {
    resolve: {
      extensions: ['.js', '.jsx', '.json']
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        }
      ]
    }
  },

  webpackMiddleware: {
    stats: 'errors-only'
  },

  // web server port
  port: 9876,

  // enable / disable colors in the output (reporters and logs)
  colors: true,

  // NOTE: This is a workaround for https://github.com/karma-runner/karma/issues/2582
  // Can probably be removed in the future
  browserConsoleLogOptions: {
    terminal: true,
    level: 'log'
  }
};

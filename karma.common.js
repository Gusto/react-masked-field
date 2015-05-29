'use strict';

module.exports = {
  // base path that will be used to resolve all patterns (eg. files, exclude)
  basePath: '',

  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['browserify', 'mocha'],

  // list of files / patterns to load in the browser
  files: ['spec/**/*.js'],

  // preprocess matching files before serving them to the browser
  // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
  preprocessors: {
    'spec/**/*.js': ['browserify']
  },


  browserify: {
    debug: true
  },

  // web server port
  port: 9876,

  // enable / disable colors in the output (reporters and logs)
  colors: true
};

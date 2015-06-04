#!/usr/bin/env node

'use strict';

var browserify = require('browserify');
var fs = require('fs');
var UglifyJS = require('uglify-js');
var packageData = require('../package.json');

var distFile = './dist/react-masked-field.js';
var minDistFile = './dist/react-masked-field.min.js';
var header = '/**\n* ' + packageData.name + ' ' + packageData.version + '\n';
var fullHeader = header +
'*\n\
* Copyright (c) 2015 ZenPayroll\n\
*\n\
* This source code is licensed under the MIT license found in the\n\
* LICENSE file in the root directory of this source tree.\n\
*/\n';
header += '*/\n';

var b = browserify('./src/MaskedField.js', {standalone: 'MaskedField'});
b.external('react');
b.bundle(function(err, buf) {
  if (err) {
    console.error(err);
    return;
  }

  var src = header + buf.toString();
  fs.writeFileSync(distFile, src);

  var minSrc = fullHeader + UglifyJS.minify(src, {fromString: true}).code;
  fs.writeFileSync(minDistFile, minSrc);
});

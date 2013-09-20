/*
 * videojs-docs
 * https://github.com/videojs/videojs-doc-generator
 *
 * Copyright (c) 2013 Brightcove Inc.
 * Licensed under the MIT license.
 */

'use strict';

var esdoc = require('./esdoc'),
    template = require('./docsjson-to-md'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp');

/**
 * process one or a set of javascript files
 * 
 * @param  {String|Array} files A string or array of file locations
 * @param  {String|Array} [options] An options object
 * @param  {Function} [callback] The callback with err, and a DocsJSON {Object}
 */
module.exports = function(files, options, callback) {
  var output;

  options = options || {};
  callback = callback || function(){};
  output = options.output;

  esdoc.process(files, options, function(err, docEntries){
    var fileHash, outputDir;

    if (err) { return callback(err); }

    fileHash = template(docEntries);

    if (output) {
      outputDir = path.resolve(options.output);

      if (!fs.existsSync(outputDir)) {
        mkdirp.sync(outputDir);
      }

      Object.keys(fileHash).forEach(function(fileName){
        fs.writeFileSync(path.resolve(outputDir + '/' + fileName), fileHash[fileName]);
      });

      callback(err, fileHash);
    } else {
      callback(err, fileHash);
    }
  });

};
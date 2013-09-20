/*
 * videojs-doc-generator
 * https://github.com/videojs/doc-generator
 *
 * Copyright (c) 2013 Steve Heffernan
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var vjsdocs = require('../');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('vjsdocs', 'Generate documentation from the video.js code', function() {
    var done = this.async();

    // merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      dest: 'docs'
    });

    // log (verbose) options before hooking in the reporter
    grunt.verbose.writeflags(options, 'docs options');

    // assume one set of files per task name
    var src = this.files[0].src;
    options.dest = this.files[0].dest || options.dest;

    vjsdocs(src, options, function(err, output){
      // Print a success message.
      grunt.log.writeln('Docs created.');
      done(err);
    });
  });
};
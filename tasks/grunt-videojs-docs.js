module.exports = function(grunt) {
  var vjsdocs = require('../');

  grunt.registerMultiTask('docs', 'Generate documentation from the video.js code', function() {
    var done = this.async();

    // merge task-specific and/or target-specific options with these defaults.
    var options = this.options({});

    // log (verbose) options before hooking in the reporter
    grunt.verbose.writeflags(options, 'docs options');

    vjsdocs(this.filesSrc, options, function(err, output){
      // console.log(output['vjs.md']);
      done(err);
    });
  });

};
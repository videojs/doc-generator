# Video.js Doc Generator

The Video.js Doc Generator reads source files and generates markdown docs. It relies on a combination of AST parsing (using [esprima](http://esprima.org)) and JSDoc-style tags.

## Getting Started
The doc generator is primarily used as a Grunt plugin.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install videojs-doc-generator --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('videojs-doc-generator');
```

## The "vjsdocs" task

### Overview
In your project's Gruntfile, add a section named `vjsdocs` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  vjsdocs: {
    all: {
      // array of source paths
      src: ['src/file.js'],

      // output directory, default is 'docs'
      dest: 'docs/api'
      
      options: {
        // The location online where the source files live
        baseURL: 'https://github.com/videojs/video.js/blob/master/'
      }
    }
  }
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Steve Heffernan. Licensed under the MIT license.
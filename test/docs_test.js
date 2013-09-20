'use strict';

var docs = require('../lib/videojs-doc-generator.js'),
    fs = require('fs');

// function compare(js, json, callback) {
//   fs.readFile(__dirname + '/fixtures/' + js, 'utf8', function(err, data){
//     if (err) { throw err; }

//     var output = esdoc.parse(data, { srcURL: 'http://example.com/file.js' });
//     var expected = require('./fixtures/'+json);

//     callback(output, expected);
//   });
// }

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['docs_test'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'class markdown': function(test) {
    test.expect(1);

    var expected = fs.readFileSync(__dirname + '/fixtures/class.md', 'utf8');

    docs([
      'test/fixtures/class.js',
      'test/fixtures/class-instance-method.js',
      'test/fixtures/class-static-method.js',
      'test/fixtures/class-instance-property.js'
      ],
      {
        baseURL: 'http://example.com/'
      }, 
      function(err, results){
        test.equal(results['MyNameSpace.MyClass.md'], expected);
        test.done();
      }
    );
  }
};

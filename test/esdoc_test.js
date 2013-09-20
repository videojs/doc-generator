'use strict';

var esdoc = require('../lib/esdoc.js'),
    fs = require('fs');

function compare(js, json, callback) {
  fs.readFile(__dirname + '/fixtures/' + js, 'utf8', function(err, data){
    if (err) { throw err; }

    var output = esdoc.parse(data, { srcURL: 'http://example.com/file.js' });
    var expected = require('./fixtures/'+json);

    callback(output, expected);
  });
}

function fixture(file, options, callback){
  options = options || {};

  fs.readFile(__dirname + '/fixtures/' + file, 'utf8', function(err, data){
    if (err) { throw err; }

    var output = esdoc.parse(data, { 
      srcURL: 'http://example.com/file.js' 
    });

    callback(output);
  });
}

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

exports['esdoc'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'class': function(test) {
    test.expect(1);
    
    compare('class.js', 'class.json', function(output, expected){
      test.deepEqual(output, expected);
      test.done();
    });
  },
  'class instance property': function(test) {
    test.expect(1);

    compare('class-instance-property.js', 'class-instance-property.json', function(output, expected){
      test.deepEqual(output, expected);
      test.done();
    });
  },
  'class instance method': function(test) {
    test.expect(1);

    compare('class-instance-method.js', 'class-instance-method.json', function(output, expected){
      test.deepEqual(output, expected);
      test.done();
    });
  },
  'class static method': function(test) {
    test.expect(1);

    compare('class-static-method.js', 'class-static-method.json', function(output, expected){
      // console.log(JSON.stringify(output, null, 2));
      test.deepEqual(output, expected);
      test.done();
    });
  },
  'private property': function(test) {
    test.expect(1);

    compare('private-property.js', 'private-property.json', function(output, expected){
      test.deepEqual(output, expected);
      test.done();
    });
  },


  'ast-identifier': function(test) {
    test.expect(3);

    fixture('ast-identifier.js', {}, function(output){
      test.ok(output['a']);
      test.equal(output['a'].name, 'a');
      test.equal(output['a'].id, 'a');

      test.done();
    });
  },
  'ast-variable-declaration': function(test) {
    test.expect(3);

    fixture('ast-variable-declaration.js', {}, function(output){
      test.ok(output['a']);
      test.equal(output['a'].name, 'a');
      test.equal(output['a'].id, 'a');

      test.done();
    });
  },
  'ast-variable-declarator': function(test) {
    test.expect(3);

    fixture('ast-variable-declarator.js', {}, function(output){
      test.ok(output['a']);
      test.equal(output['a'].name, 'a');
      test.equal(output['a'].id, 'a');

      test.done();
    });
  },
  'ast-assignment-expression': function(test) {
    test.expect(3);

    fixture('ast-assignment-expression.js', {}, function(output){
      test.ok(output['a']);
      test.equal(output['a'].name, 'a');
      test.equal(output['a'].id, 'a');

      test.done();
    });
  },
  'ast-member-expression': function(test) {
    test.expect(4);

    fixture('ast-member-expression.js', {}, function(output){
      test.ok(output['a.b']);
      test.equal(output['a.b'].name, 'b');
      test.equal(output['a.b'].id, 'a.b');
      test.equal(output['a.b'].memberof, 'a');

      test.done();
    });
  },
  'ast-property': function(test) {
    test.expect(4);

    fixture('ast-property.js', {}, function(output){
      test.ok(output['a.b']);
      test.equal(output['a.b'].name, 'b');
      test.equal(output['a.b'].id, 'a.b');
      test.equal(output['a.b'].memberof, 'a');

      test.done();
    });
  },
  'classical-inheritance-extend-api': function(test) {
    fixture('classical-inheritance-extend-api.js', {}, function(output){
      test.ok(output['a']);
      test.equal(output['a'].name, 'a');
      test.equal(output['a'].type, 'class');
      test.equal(output['a'].inherits, 'BaseClass');

      test.ok(output['a#init']);
      test.equal(output['a#init'].name, 'init');
      test.equal(output['a#init'].id, 'a#init');

      test.ok(output['a#method1']);
      test.equal(output['a#method1'].name, 'method1');
      test.equal(output['a#method1'].id, 'a#method1');

      test.ok(output['a#method2']);
      test.equal(output['a#method2'].name, 'method2');
      test.equal(output['a#method2'].id, 'a#method2');

      test.ok(output['a.staticMethod']);
      test.equal(output['a.staticMethod'].name, 'staticMethod');
      test.equal(output['a.staticMethod'].id, 'a.staticMethod');

      test.ok(output['b']);
      test.equal(output['b'].name, 'b');
      test.equal(output['b'].type, 'class');
      test.equal(output['b'].inherits, 'a');

      test.ok(output['c']);
      test.equal(output['c'].name, 'c');
      test.equal(output['c'].type, 'class');
      test.equal(output['c'].inherits, 'BaseClass');

      test.ok(output['notClass1']);
      test.notEqual(output['notClass1'].type, 'class');
      test.ok(output['notClass2']);
      test.notEqual(output['notClass2'].type, 'class');

      test.done();
    });
  },
  'type-inference': function(test) {
    fixture('type-inference.js', {}, function(output){
      test.equal(output['obj'].type, 'member');
      test.equal(output['arr'].type, 'member');
      test.equal(output['func'].type, 'function');
      test.equal(output['date'].type, 'member');
      test.equal(output['str'].type, 'member');
      test.equal(output['bool'].type, 'member');
      test.equal(output['num'].type, 'member');
      
      test.done();
    });
  },
  'comment': function(test) {
    fixture('comments.js', {}, function(output){

      // description
      test.equal(output['description'].description, 'description');
      // summary
      test.equal(output['summary'].summary, 'summary');
      test.equal(output['summary'].description, 'summary\n\ndescription');
      // description and tags
      test.equal(output['descriptionAndTags'].summary, 'summary');
      test.equal(output['descriptionAndTags'].description, 'summary\n\ndescription');
      test.equal(output['descriptionAndTags'].tagname1, true);
      test.equal(output['descriptionAndTags'].tagname2, 'with value');

      // @class
      test.equal(output['tagClass'].type, 'class');
      // @memberof
      test.ok(output['Namespace.tagMemberof']);
      test.equal(output['Namespace.tagMemberof'].name, 'tagMemberof');
      test.equal(output['Namespace.tagMemberof'].memberof, 'Namespace');

      // @param
      test.equal(output['tagParam'].params.length, 1);
      test.equal(output['tagParam'].params[0].name, 'name');
      test.deepEqual(output['tagParam'].params[0].types, ['Type1', 'Type2']);
      test.equal(output['tagParam'].params[0].description, 'description');

      test.equal(output['tagParamNoType'].params.length, 1);
      test.equal(output['tagParamNoType'].params[0].name, 'name');
      test.deepEqual(output['tagParamNoType'].params[0].types, undefined);
      test.equal(output['tagParamNoType'].params[0].description, 'description');

      // @returns
      test.equal(output['tagReturns'].returns.length, 1);
      test.deepEqual(output['tagReturns'].returns[0].types, ['Type1', 'Type2']);
      test.equal(output['tagReturns'].returns[0].description, 'description');

      test.equal(output['tagReturnsNoType'].returns.length, 1);
      test.deepEqual(output['tagReturnsNoType'].returns[0].types, undefined);
      test.equal(output['tagReturnsNoType'].returns[0].description, 'description');

      // @event
      test.ok(output['event:myEvent']);
      test.equal(output['event:myEvent'].name, 'myEvent');
      test.equal(output['event:myEvent'].type, 'event');

      test.ok(output['NameSpace.event:myNSEvent']);
      test.equal(output['NameSpace.event:myNSEvent'].name, 'myNSEvent');
      test.equal(output['NameSpace.event:myNSEvent'].type, 'event');

      test.ok(output['ClassName#event:myInstanceEvent']);
      test.equal(output['ClassName#event:myInstanceEvent'].name, 'myInstanceEvent');
      test.equal(output['ClassName#event:myInstanceEvent'].type, 'event');

      test.done();
    });
  }

};

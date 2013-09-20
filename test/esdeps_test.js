'use strict';

var escope = require('escope'),
    estraverse = require('estraverse'),
    esprima = require('esprima'),
    fs = require('fs');

function compare(js, json, callback) {
  fs.readFile(__dirname + '/fixtures/' + js, 'utf8', function(err, data){
    // if (err) { throw err; }

    // // var output = esdoc.parse(data, { srcURL: 'http://example.com/file.js' });
    // // var expected = require('./fixtures/'+json);

    // callback(output, expected);
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
    // test.expect(1);

    var ast = esprima.parse('var a; b.c = { d: { e: true } }; b.c.d.f = { g: true }; a = { x: true }; a.b;');

    // console.log('\n\n\n---\n\n\n');

    var objScope = [];

    estraverse.traverse(ast, {
      enter: function(node, parent) {
        if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
          return estraverse.VisitorOption.Skip;
        }

        if (node.type === 'ObjectExpression') {
          if (parent.type === 'VariableDeclarator') {
            objScope.push(parent.id.name);
          } else if (parent.type === 'Property') {
            objScope.push(parent.key.name);
          }
        }

        if (node.type === 'AssignmentExpression') {
          // console.log(objScope.concat([getMemberID(node.left)]).join('.'));
          objScope = objScope.concat(getMemberID(node.left).split('.'));
        } else if (node.type === 'VariableDeclarator') {
          // console.log(node.id.name);
        } else if (node.type === 'Property') {
          // console.log(objScope.concat([node.key.name]).join('.'));
        } else if (node.type === 'ExpressionStatement' && node.expression.type === 'MemberExpression') {
          // console.log(getMemberID(node.expression));  
        }
      },
      leave: function(node, parent) {
        if (node.type === 'ObjectExpression') {
          objScope.pop();
        } else if (node.type === 'AssignmentExpression') {
          objScope = objScope.slice(0, -(getMemberID(node.left).split('.').length));
        }
      }
    });

    // console.log('\n\n\n---\n\n\n');

    function getMemberID(node) {
      var id;

      if (node.type === 'Identifier') {
        return node.name;
      } else {
        id = getMemberID(node.object) + '.' + node.property.name;
        return id;
      }
    }

    // fs.readFileSync(__dirname + '/fixtures/' + js, 'utf8', function(err, data){

    test.done();
  }
};

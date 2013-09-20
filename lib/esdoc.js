/*
 * esdoc
 */

'use strict';

var esprima = require('esprima'),
    estraverse = require('estraverse'),
    escope = require('escope'),
    dox = require('dox'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    _ = require('lodash'),
    comment = require('./comment.js'),
    helpers = require('./entry-helpers.js');

/**
 * process one or a set of javascript files
 * 
 * @param  {String|Array} files A string or array of file locations
 * @param  {Object} [options] An options object
 * @param  {Function} [callback] The callback with err, and a DocsJSON {Object}
 */
exports.process = function(files, options, callback) {
  var docEntries = {};

  options = options || {};
  callback = callback || function(){};
  
  if (!util.isArray(files)) { 
    files = [files];
  }

  files.forEach(function(file){
    var str, parseOptions;

    str = fs.readFileSync(path.resolve(file), { encoding: 'utf-8' });
    parseOptions = {
      srcName: file
    };

    if (options.baseURL) {
      parseOptions.srcURL = options.baseURL + file;
    }

    _.extend(docEntries, exports.parse(str, parseOptions));
  });

  callback(null, docEntries);
};

/**
 * parse a string of javascript
 * 
 * @param  {String} str     The string of javascript
 * @param  {Object} options An options object
 * @return {Array}          A list of doc entries
 */
exports.parse = function(str, options) {
  var entries, ast, nodesByLineNum, commentsByLineNum, codeLines,
      parentObjects, scopeLevel;

  options = options || {};

  // a list of doc entries will be returned
  entries = {};

  // parse AST of js string, Spidermonkey Parser API format
  ast = esprima.parse(str, { comment: true, loc: true, raw: true });

  // { line number: highest node that is defined on the line }
  nodesByLineNum = {};

  // { line number: comment that immediately preceds the line }
  commentsByLineNum = {};

  ast.comments.forEach(function(commentNode){
    // assume block comments with double asterisk only for now, ex. /** */
    if (commentNode.type === 'Block' && commentNode.value.indexOf('*') === 0) {
      // assume the line immediately following the comment is being defined
      commentsByLineNum[commentNode.loc.end.line + 1] = commentNode;
    }
  });

  // split the code string for referencing by line number (1-based array)
  codeLines = ('\n'+str).split('\n');

  // when traversing, track the current object scope
  // ex. when looking at the node for `c` in `a.b = { c: d }`, the scope is a.b
  parentObjects = [];
  // once we get inside function scopes we can't (yet) infer full member IDs
  // and relationships. tags will have to be relied on at that level for now
  scopeLevel = 0;

  // traverse down the abstract syntax tree. weeee!
  estraverse.traverse(ast, {
    // entering a node and all of its children
    enter: function(node, parent){
      var entry, commentNode, commentStr, lineNum, lineStr;

      // the top node in the ast is always 'Program'
      if (node.type === 'Program') {
        return;
      }

      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        // we're no longer in global scope. stuff gets hard
        scopeLevel++;
      }

      // if we're diving into an object, keep track of how deep
      if (node.type === 'ObjectExpression') {
        if (parent.type === 'VariableDeclarator') {
          parentObjects.push(parent.id.name);
        } else if (parent.type === 'Property') {
          parentObjects.push(parent.key.name);
        }
      } else if (node.type === 'AssignmentExpression') {
        parentObjects = parentObjects.concat(getMemberFullName(node.left).split('.'));
      }

      lineNum = node.loc && node.loc.start.line;
      commentNode = commentsByLineNum[lineNum];

      // only document if this line of code has a comment
      // and if this line of code has not been addressed through a higher node
      if (commentNode && !nodesByLineNum[lineNum]) {
        // record that we have addressed this line of code
        nodesByLineNum[lineNum] = node;

        // remove block comment syntax from comment
        commentStr = commentNode.value.replace(/^\*/, '').replace(/^[ \t]*\* ?/gm, '');

        // get the string of the first line of code
        lineStr = codeLines[lineNum].trim();

        // start building a doc entry
        entry = {
          src: {
            line: lineNum
          }
        };

        // ex: "https://github.com/videojs/video.js/blob/master/src/js/core.js"
        if (options.srcURL) {
          entry.src.url = options.srcURL;
        }

        // ex: "src/js/core.js"
        if (options.srcName) {
          entry.src.name = options.srcName;
        }

        // get info from the code string
        _.extend(entry, exports.parseCommentCodeString(lineStr));

        // get info from the AST
        _.extend(entry, exports.parseCommentCodeAST(node, {
          scopeLevel: scopeLevel,
          parentObjects: parentObjects
        }));

        // get info from the comment text and tags
        _.extend(entry, comment.parse(commentStr));

        entries[helpers.generateId(entry)] = entry;
      }
    },
    // leaving a node and all of its children
    leave: function(node, parent){
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        scopeLevel--;
      }

      if (node.type === 'ObjectExpression') {
        parentObjects.pop();
      } else if (node.type === 'AssignmentExpression') {
        parentObjects = parentObjects.slice(0, -(getMemberFullName(node.left).split('.').length));
      }
    }
  });

  entries = analyzeRelationships(entries);

  return entries;
};

/**
 * parse info from the first line of code after a comment
 * 
 * @param  {String} str The line of code
 * @return {Object}     Doc entry info
 */
exports.parseCommentCodeString = function(str){
  var context, entry;

  context = dox.parseCodeContext(str);
  entry = {};

  if (!context) {
    return entry;
  }

  // only set the key if there is a value
  if (context.name) { entry.name = context.name; }
  if (context.type) {
    if (context.type === 'property' || context.type === 'declaration') {
      entry.type = 'member';
    } else if (context.type === 'method' || context.type === 'function') {
      entry.type = 'function';
    }
  }
  if (context.cons) {
    entry.memberof = context.cons;
    entry.instance = true;
  }
  if (context.receiver) { 
    entry.memberof = context.receiver;
  }

  return entry;
};

/**
 * parse the AST that follows a comment
 * 
 * @param  {Object} node The AST node that follows a comment
 * @return {Object}     Doc entry info
 */
exports.parseCommentCodeAST = function(node, options){
  var entry, value, name, instance, memberof, id, type, 
      scopeLevel, parentObjects, superID, prevInfo;

  options = options || {};
  scopeLevel = options.scopeLevel || 0;
  parentObjects = options.parentObjects || [];

  entry = {};

  // get info that may have been discovered in a previous expression
  prevInfo = node._ent;

  if (node.type === 'ExpressionStatement') {
    node = node.expression;
  }

  if (node.type === 'AssignmentExpression') {
    value = node.right;
    node = node.left;
  }

  // the left side of an object property assignment, ex: `a.b = 1;`
  // or just an empty object reference, ex: `a.b;`
  if (node.type === 'MemberExpression') {
    id = (scopeLevel === 0) && getMemberID(node, parentObjects);
    name = getMemberName(node);
    instance = isInstanceMember(node);
    memberof = (scopeLevel === 0) && getMemberParentID(node, parentObjects);
  
  // the left value in a non-member assignment, ex: `a = 1`
  } else if (node.type === 'Identifier') {
    id = (scopeLevel === 0) && node.name;
    name = node.name;

  // the var name inside a var declaration, ex: the `b` node in the following
  //     /** comment */
  //     var a;
  //      
  } else if (node.type === 'VariableDeclaration') {
    // assume there is at least one var, and the comment is for the first
    node = node.declarations[0];
    name = node.id.name;
    id = (scopeLevel === 0) && node.id.name;
    value = node.init;

  // the var name inside a var declaration, ex: the `b` node in the following
  //     var a,
  //         /** comment */
  //         b;
  //         
  } else if (node.type === 'VariableDeclarator') {
    name = node.id.name;
    id = (scopeLevel === 0) && node.id.name;
    value = node.init;

  // a property assignment in an object expression
  //    a = {
  //      /** comment */
  //      b: c
  //    }
  } else if (node.type === 'Property') {
    if (scopeLevel === 0) {
      id = fullNameToID(parentObjects.join('.') + '.' + node.key.name);
      memberof = parentFullNameToID(parentObjects.join('.'));
    }
    name = node.key.name;
    value = node.value;
  }

  // try to infer the type from the value of an assignment
  if (value) {
    if (value.type === 'FunctionExpression') {
      type = 'function';

      if (value.params) {
        entry.params = [];
        value.params.forEach(function(param){
          entry.params.push({
            name: param.name
          });  
        });
      }
    } else if (value.type === 'CallExpression') {
      // a.extend
      if (value.callee.type === 'MemberExpression' && getMemberName(value.callee) === 'extend') {
        // a.exend() or a.extend({}) not _.extend()
        if (getMemberParentFullName(value.callee) !== '_') {
          type = 'class';

          if (value.arguments[0] && value.arguments[0].type === 'ObjectExpression') {
            value.arguments[0].properties.forEach(function(prop){
              // store info about this node in the ast to be picked up later
              prop._ent = {
                id: id + '#' + getMemberName(prop.key),
                name: getMemberName(prop.key),
                instance: true,
                memberof: id
              };
            });
          }
        }

        if (scopeLevel === 0) {
          entry.inherits = getMemberParentID(value.callee, parentObjects);
        }
      }
    } else if (value.type === 'NewExpression') {
      superID = getMemberID(value.callee, parentObjects);

      if (scopeLevel === 0) {
        if (_.contains(['String', 'Object', 'Array', 'Date', 'Number', 'Boolean', 'RegExp'], superID)) {
          entry.type = 'member';
        } else if (superID === 'Function') {
          entry.type = 'function';
        }
      }
    }
  }

  // Only set if it has value
  if (id) { entry.id = id; }
  if (name) { entry.name = name; }
  if (instance) { entry.instance = instance; }
  if (memberof) { entry.memberof = memberof; }
  if (type) { entry.type = type; }

  if (prevInfo) {
    _.extend(entry, prevInfo);
  }

  return entry;
};

// she wants more love; he wants more respect. duh.
function analyzeRelationships(entries) {
  Object.keys(entries).forEach(function(entryID){
    var entry, memberof, inherits;

    entry = entries[entryID];
    memberof = entry.memberof && entries[entry.memberof];
    inherits = entry.inherits && entries[entry.inherits];

    // assume parents of documented members are at least namespaces
    if (memberof && (memberof.type === 'function' || memberof.type === 'member')) {
      memberof.type = 'namespace';
    }

    // assume instance members belong to a class
    if (memberof && memberof.type === 'namespace') {
      if (entry.instance) {
        memberof.type = 'class';
      }
    }

    // assume classes inherit from classes
    // this will need to be adjusted if we can define multiple inheritance
    if (inherits) {
      if (entry.type === 'class' || inherits.type === 'class') {
        entry.type = 'class';
        inherits.type = 'class';
      }
    }
  });

  return entries;
}

// name: myMember
// fullname: MyClass.prototype.myMember
// ID: MyClass#myMember
function getMemberName(node) {
  return (node.property && node.property.name) || node.name;
}

function getMemberFullName(node, parentObjects) {
  var name = '';

  if (node) {
    if (node.type === 'Identifier') {
      name = node.name;
    } else {
      name = getMemberFullName(node.object)+'.'+getMemberName(node);
    }
  }

  if (parentObjects && parentObjects.length > 0) {
    name = parentObjects.join('.') + '.' + name;
  }

  return name;
}

function getMemberParentFullName(node, parentObjects) {
  var name = '';

  if (node.type === 'Identifier') {
    return getMemberFullName(false, parentObjects);
  } else {
    return getMemberFullName(node.object, parentObjects);
  }
}

function getMemberID(node, parentObjects) {
  return fullNameToID(getMemberFullName(node, parentObjects));
}

function getMemberParentID(node, parentObjects) {
  var parentName = getMemberParentFullName(node, parentObjects);
  return parentFullNameToID(parentName);
}

function fullNameToID(name){
  return name.replace(/\.prototype\.?/g, '#');
}

// Assuming the child of a prototype is the child of the prototype's parent
// (for documentation purposes)
function parentFullNameToID(name){
  return fullNameToID(name.replace(/\.prototype$/, ''));
}

function isInstanceMember(node, parentObjects) {
  // check for parent#name in ID
  return (/#[^#]+$/).test(getMemberID(node, parentObjects));
}
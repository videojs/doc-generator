// The 'extend' method is a popular API for class inheritance in javascript
// While implementations may vary, the API is the same in many projects
// Popularized by John Resig (of jQuery) 
//    http://ejohn.org/blog/simple-javascript-inheritance/
// Used in projects including Ember.js and Video.js

/** comment */
var a = BaseClass.extend({
  /** comment */
  init: function(){},
  /** comment */
  method1: function(){}
});

/** comment */
a.prototype.method2 = function(){};

/** comment */
a.staticMethod = function(){};

/** comment */
var b = a.extend();

/** comment */
var c = BaseClass.extend();

/** comment */
var notClass1 = _extend({});
/** comment */
var notClass2 = _.extend({});
/*
 * comment
 */

'use strict';

var _ = require('lodash'),
    helpers = require('./entry-helpers.js');

// based on JSDoc "kinds" http://usejsdoc.org/
var ENTRY_TYPES = {
  'class': 'class', 
  'constant': 'constant',
  'event': 'event',
  'external': 'external',
  'file': 'file',
  'function': 'function', 
  'member': 'member',
  'method': 'function',
  'mixin': 'mixin',
  'module': 'module',
  'namespace': 'namespace'
};

/**
 * parse a comment for description and tag info
 * 
 * @param  {String} commentText The comment text
 * @return {Object}             Doc entry info
 */
exports.parse = function(commentText){
  var comment, entry, tagBlock;

  commentText = commentText.trim();
  entry = {};

  // check if there's only tags
  if (commentText.indexOf('@') === 0) {
    tagBlock = commentText;
  } else {
    // get all text before the first tag as the description
    entry.description = commentText.split('\n@')[0].trim();
    // get everything after the first tag as the block of tags
    tagBlock = commentText.split('\n@').slice(1).join('\n@');
    // the summary is the first line with with two line breaks following
    entry.summary = entry.description.split('\n\n')[0];
  }

  if (tagBlock) {
    _.extend(entry, exports.parseTags(tagBlock));
  }

  return entry;
};

exports.parseTags = function(tags){
  var entry = {};

  if (typeof tags === 'string') {
    tags = tags.split('\n@');
  }

  // loop through tags, which may have multiple lines
  tags.forEach(function(tagStr){
    var tagParts, tag, param, ret;

    tag = {};

    // `@name {types} description`
    tagParts = tagStr.match(/^@?([^\s]+)[\s]*({.*?})?[\s]*(.*)?$/m);
    tag.name = tagParts[1]; 

    // split type definitions `{Object|String}`
    if (tagParts[2]) {
      tag.types = tagParts[2].replace(/[{}]/g, '').split(/\s*[|,\/]\s*/);
    }
    tag.description = tagParts[3];

    // type tags `@class MyClass`
    if (ENTRY_TYPES.hasOwnProperty(tag.name)) {
      entry.type = ENTRY_TYPES[tag.name];
      if (tag.description) {
        entry.name = tag.description;
      }
    // params `@param {Object} options The options param`
    } else if (tag.name === 'param') {
      param = exports.parseParamTag(tag);
      // don't add empty params
      if (param) {
        entry.params = entry.params || [];
        entry.params.push(param);  
      }
    // returns
    } else if (tag.name === 'return' || tag.name === 'returns') {
      if (!tag.types && !tag.description) {
        return;
      }
      entry.returns = entry.returns || [];
      ret = {};

      if (tag.types) {
        ret.types = tag.types;
      }

      if (tag.description) {
        ret.description = tag.description;
      }

      entry.returns.push(ret);
    // name
    } else if (tag.name === 'name') {
      entry.name = tag.description;
    // deprecated
    } else if (tag.name === 'deprecated') {
      entry.deprecated = true;
    // extends
    } else if (_.contains(['extends', 'augments', 'inherits'], tag.name)) {
      entry.inherits = tag.description;
    // types - a property can have a type tag
    } else if (tag.name === 'type') {
      entry.types = tag.types;
    // inheritdoc
    } else if (tag.name.toLowerCase() === 'inheritdoc') {
      entry.inheritdoc = true;
    // memberof
    } else if (tag.name.toLowerCase() === 'memberof') {
      entry.memberof = tag.description;
    // allow unhandled tags
    } else {
      entry[tag.name] = tag.description || true;
    }
  });

  // if (!entry.id && entry.name && entry.memberof) {
  //   entry.id = helpers.generateId(entry);
  // }

  return entry;
};

/**
 * parse a param tag `@param {Object} options The options param`
 * 
 * @param  {Object} tag The tag info
 * @return {Object}     The param info
 */
exports.parseParamTag = function(tag) {
  var param = {};

  if (!tag || (!tag.types && !tag.description)) {
    return;
  }

  if (tag.types) {
    param.types = tag.types;

    // check if optional last char of a type is "?" (TypeScript) or "=" (Google)
    param.types.forEach(function(type, i){
      if (['=','?'].indexOf(type.slice(-1)) !== -1) {
        param.optional = true;
        // remove ? and =
        param.types[i] = type.replace(/[=\?]$/, '');
      }
    });
  }

  if (tag.description) {
    // the param name follows the type
    param.name = tag.description.split(/\s+/)[0];
    // param description comes after the name
    param.description = tag.description.split(/\s+/).slice(1).join(' ');

    // check if optional through square brackets around [name]
    if (param.name.indexOf('[') === 0) {
      param.optional = true;
      // remove brackets
      param.name = param.name.replace(/[\[\]]/g, '');
    }
  }

  return param;
};
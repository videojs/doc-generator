'use strict';

var _ = require('lodash');

/**
 * entry types, based on JSDoc "kinds" http://usejsdoc.org/
 *
 * @type {Object}
 */
exports.ENTRY_TYPES = {
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
 * plural versions of entry words
 * 
 * @type {Object}
 */
exports.PLURALS = {
  'method': 'methods',
  'property': 'properties',
  'event': 'events',
  'class': 'classes',
  'namespace': 'namespaces',
  'constant': 'constants'
};

/**
 * create a github-style target name from a title
 * 
 * @param  {String} str The title string to change into a target name
 * @return {String}     The target name
 */
exports.makeGithubTitleTarget = function(str){
  return str.toLowerCase().replace(/[\.,\|\(\)<>\[\]`]/gm, '').replace(/[\s]/gm, '-');
};

/**
 * convert a string into a markdown blockquote
 * 
 * @param  {String} str The title string to change
 * @return {String}     The string as a blockquote
 */
exports.blockQuote = function(str){
  return '> ' + str.replace(/\n/gm, '\n> ');
};

/**
 * build a docs structure around namespaces and classes
 *
 * ##### EXAMPLE
 *
 * will return an object of docs
 * 
 *     {
 *       'MyNameSpace': {
 *         'name': 'MyNameSpace'
 *         'entriesByType': {
 *           'classes': []
 *         }
 *       },
 *       'MyNameSpace.MyClass1': {
 *          'name': 'MyClass1',
 *          'entriesByType': {
 *            'functions': [],
 *            'members': []
 *          }
 *       }
 *     }
 * 
 * @param  {Object} entries The object of Docs JSON entries
 * @return {Object}         An object where each key is doc
 */
exports.buildDocsStructure = function(entries, options){
  var struct = {};

  options = options || {};

  Object.keys(entries).forEach(function(id){
    var entry, parentID, parent, children, sup;

    entry = entries[id];

    if (!entry.name || (entry.private && !options.includePrivate)) {
      return;
    }

    if (entry.type === 'class' || entry.type === 'namespace') {
      if (struct[id]) {
        children = struct[id].entriesByType;
      }

      struct[id] = entry;
      entry.entriesByType = children || {};

      // add inherited members
      if (entry.inherits) {
        sup = struct[entry.inherits];

        if (sup && sup.entriesByType) {
          Object.keys(sup.entriesByType).forEach(function(type){
            var existingEntry;

            sup.entriesByType[type].forEach(function(inheritedEntry){
              if (inheritedEntry.instance) {
                // dont' overwrite existing members
                existingEntry = entries[id+'#'+inheritedEntry.name];
                if (existingEntry) {
                  if (existingEntry.inheritdoc) {
                    existingEntry.description = inheritedEntry.description;
                    existingEntry.summary = inheritedEntry.summary;

                    if (existingEntry.params) {
                      existingEntry.params = inheritedEntry.params;  
                    }

                    if (existingEntry.returns) {
                      existingEntry.returns = inheritedEntry.returns;  
                    }
                  }
                } else {
                  inheritedEntry = _.extend({ inherited: true }, inheritedEntry);

                  entry.entriesByType[type] = entry.entriesByType[type] || [];
                  entry.entriesByType[type].push(inheritedEntry);
                }
              }
            });
          });
        }
      }
    }
  
    parentID = entry.memberof;

    if (parentID) {
      parent = struct[parentID] = struct[parentID] || { entriesByType: {} };

      parent.entriesByType[entry.type] = parent.entriesByType[entry.type] || [];
      parent.entriesByType[entry.type].push(entry);

      // sort members alphabetically
      parent.entriesByType[entry.type] = _(parent.entriesByType[entry.type]).sortBy('name');
    }
    
  });

  return struct;
};

/**
 * build a link from entry source info
 * @param  {Object} entry The entry information
 * @return {String}       The markdown style link
 */
exports.srcLink = function(entry){
  var url, line, name;

  url = entry.src.url;
  line = '#L' + entry.src.line;
  name = entry.src.name;

  // if there's no name, modify the URL
  if (!name) {
    name = url;

    // shorten name to everything after the repo + branch info
    // https://github.com/videojs/video.js/tree/stable/src/js --> src/js
    if (name.toLowerCase().indexOf('github.com') !== -1) {
      name = name.replace(/^(https?:\/\/)?github.com\/.*?\/.*?\/.*?\/.*?\//, '');

    // otherwise just shorten to the file name
    } else {
      name = name.replace(/.*[\/]/, '');
    }
  }

  return '['+name+line+']('+url+line+')';
};

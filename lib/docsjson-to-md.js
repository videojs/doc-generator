'use strict';

var helpers = require('./template-helpers.js');

// the entry types that should have dedicated doc files
var docTypes = ['class', 'namespace'];

/**
 * a template for turning docs entries into github-markdown docs
 *
 * ##### EXAMPLE:
 * returns an object like the following
 *
 *     {
 *       "MyNameSpace.md": "# MyNameSpace\n\nHas these classes...",
 *       "MyNameSpace.MyClass1.md": "# MyClass1\n\nThis Class does..."
 *     }
 * 
 * @param  {Object} entries The entries returned by esdoc
 * @param  {Object} [options]
 * @return {Object}         An object of docs
 */
module.exports = function(entries, options){
  var struct, docs;

  if (typeof entries === 'string') {
    entries = JSON.parse(entries);
  }

  options = options || {};
  
  // the object of docs that will be returned
  docs = {};

  // build the document structure
  struct = helpers.buildDocsStructure(entries);

  Object.keys(struct).forEach(function(id){
    var docInfo, docFileName, doc;

    docInfo = struct[id];

    docFileName = id+'.md';
    doc = '<!-- GENERATED FROM SOURCE -->\n\n';

    // title
    doc += '# ' + id + '\n\n';

    // inherits
    if (docInfo.inherits) {
      doc += '__EXTENDS__: '+docLink(docInfo.inherits)+'  \n';
    }

    // defined
    if (docInfo.src && docInfo.src.url) {
      doc += '__DEFINED IN__: '+helpers.srcLink(docInfo)+'  \n';
    }

    // description
    if (docInfo.description) {
      doc += '\n' + docInfo.description + '\n';
    }

    // details, e.g. deprecated
    doc += handleDetails(docInfo);

    doc += '\n---\n\n';

    // index
    var childTypes = Object.keys(docInfo.entriesByType);

    if (childTypes.length > 0) {
      var index = {};
      var body = '';

      childTypes.forEach(function(childType){
        var typeName, inheritedItems;

        typeName = childType;
        inheritedItems = [];

        // any function within a class would be a method
        if (childType === 'function') {
          typeName = 'method';
        } else if (childType === 'member') {
          typeName = 'property';
        }

        index[typeName] = [];

        if (docTypes.indexOf(childType) === -1) {
          body += '## ' + (helpers.PLURALS[typeName] || typeName).toUpperCase() + '\n\n';
        }

        docInfo.entriesByType[childType].forEach(function(child){
          var titleName, indexItem, definedText;

          titleName = buildTitleName(child, {
            showStatic: (docInfo.type === 'class')
          });

          if (docTypes.indexOf(child.type) !== -1) {
            indexItem = '['+child.name + ']('+child.id+'.md)';
          } else {
            indexItem = '['+child.name + '](#'+helpers.makeGithubTitleTarget(titleName)+')';
          }

          ['deprecated', 'inherited', 'private'].forEach(function(n){
            if (child[n]) {
              indexItem += ' _`'+n+'`_';
            }
          });

          if (child.inherited) {
            inheritedItems.push(indexItem);
          } else {
            index[typeName].push(indexItem);
          }

          if (docTypes.indexOf(childType) === -1) {
            body += '### ' + titleName + '\n';

            if (child.description) {
              body += helpers.blockQuote(child.description) + '\n';  
            }
            
            body += handleDetails(child);
            body += handleParams(child.params);
            body += handleParams(child.returns, { title: 'RETURNS' });

            if (child.src && child.src.url) {
              definedText = 'defined in';
              if (child.inherited) {
                definedText = 'inherited from';
              }
              body += '\n_'+definedText+'_: '+helpers.srcLink(child)+'\n';
            }

            body += '\n---\n\n';
          }
        });

        index[typeName] = index[typeName].concat(inheritedItems);
        inheritedItems = [];
      });

      doc += handleIndex(index);
      doc += body;
    }

    docs[docFileName] = doc;
  });

  return docs;
};

function handleIndex(index){
  var str, sectionTitle;

  str = '## INDEX\n';

  Object.keys(index).forEach(function(type){

    sectionTitle = (helpers.PLURALS[type] || type).toUpperCase();

    if (docTypes.indexOf(type) !== -1) {
      str += '\n- '+sectionTitle+'\n';
    } else {
      str += '\n- ['+sectionTitle+'](#'+sectionTitle.toLowerCase()+')\n';
    }

    index[type].forEach(function(item){
      str += '  - ' + item + '\n';
    });
  });

  str += '\n---\n\n';

  return str;
}

function handleDetails(entry){
  var str, details, detailCap;

  str = '';
  // add more details as needed
  details = ['deprecated'];

  details.forEach(function(detail){
    if (entry[detail]) {
      detailCap = detail.slice(0,1).toUpperCase() + detail.slice(1);
      str += '**'+detailCap+'** ' + entry[detail] + '\n';
    }
  });

  return str;
}

function handleParams(params, options){
  var str = '';
  options = options || {};

  if (!params || params.length < 1) {
    return str;
  }

  str += '\n##### '+(options.title || 'PARAMETERS')+': \n';

  params.forEach(function(param){
    str += '* ';

    if (param.name) {
      str += '__' + param.name + '__ ';
    }

    if (param.types) {
      str += '`' + param.types.join('|') + '` ';
    }

    if (param.optional) {
      str += '_(OPTIONAL)_ ';
    }

    if (param.description) {
      str += param.description;
    }

    str += '\n';
  });

  return str;
}

function docLink(entryId){
  return '['+entryId+']('+entryId+'.md)';
}

function buildTitleName(entry, options){
  var name, paramName;

  options = options || {};

  name = entry.name;

  if (entry.type === 'function') {
    name += '(';
    
    if (entry.params && entry.params.length) {
      name += ' ';

      entry.params.forEach(function(param, i){
        paramName = param.name;

        if (param.optional) {
          paramName = '[' + paramName + ']';
        }

        if (i < entry.params.length - 1) {
          paramName += ', ';
        }

        name += paramName;
      });

      name += ' ';
    }

    name += ')';

  } else if (entry.type === 'event') {
    name += ' `EVENT`';
  }

  if (options.showStatic && !entry.instance) {
    name += ' `STATIC`';
  }

  // if (entry.inherited) {
  //   name += ' `INHERITED`';
  // }

  return name;
}
/**
 * generate the entry ID (namePath) based on entry data
 *
 * The ID is entry's namepath, the parent object's namepath plus the
 * entry's name, separted by a hash mark (#) for instance properties/methods and
 * a period (.) for everything else
 *
 * @param {Object} entry The entry
 */
exports.generateId = function(entry) {
  var id, separator;

  id = '';
  separator = (entry.instance) ? '#' : '.';

  if (entry.memberof) {
    id += entry.memberof + separator;
  }

  if (entry.type === 'event') {
    id += 'event:';
  }

  return id + entry.name;
};
const _file = require('./lib/file.js');
const _utils = require('./lib/utils.js');

// console.log(_file.walk('..', 'service.js', ['example']));
//
// console.log(_file.readBin('index.js'));

let ids = [ { _id: 2, id: 1}, {_id:'aa', id: 3}];
_utils.remove_ids(ids);
console.log(ids);
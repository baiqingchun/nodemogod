let MG = require('./mongo_base.js');

exports.db = MG.db;
exports.connectDB = MG.connectDB;
exports.OnConnected = MG.OnConnected;
exports.add_index = MG.add_index;

// exports.tokenVerify = require('./verify.js').tokenVerify;

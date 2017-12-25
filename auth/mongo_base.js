// Usage: 
// mongo.User.find().exec().then()
// mongo.User.insertOne({name: 'abc', password: 'bbbddd', ...}).exec().then();

const Mongolass = require('mongolass');
const mongolass = new Mongolass();

const Q = require('q');

exports.db = { mongolass: mongolass };
const db = exports.db;

let connected = [];
exports.OnConnected = function (fn) {
    if (fn) {
        connected.push(fn);
    }
};

const index_operations = [];

exports.add_index = function (table, indexJson, isUnique) {
    if (isUnique) {
        index_operations.push(table.index(indexJson, {unique: true}).exec());
    } else {
        index_operations.push(table.index(indexJson).exec());
    }
};

//'mongodb://localhost:27017/db1'
//'mongodb://root:Bdclab123@dds-2ze29c61c95941c42.mongodb.rds.aliyuncs.com:3717,dds-2ze29c61c95941c41.mongodb.rds.aliyuncs.com:3717/admin?replicaSet=mgset-3297869'
exports.connectDB = function (conn) {
    return mongolass.connect(conn).then(function () {

        //================USER RELATED==================
        db.User = mongolass.model('User', {
            id: {type: 'string'},
            password: {type: 'string'},
            nickname: {type: 'string'},
            //Tou2Xiang4
            avatar: {type: 'string'},
            info: {type: 'string'},
            lastLogin: {type: 'date'},
            createDate: {type: 'date'},

            weChatToken:{type: 'string'},
            weiboToken:{type: 'string'},

            priv: {type: 'number'},
            access:{type: 'string'},
            company:{type: 'string'},

            boughtVideos:{type:'string'},//videos already be bought and may be downloaded or not be downloaded by VR device.
            boughtVideoGroups:{type:'string'},//a group whose videos are all be bought.

            roomId: {type: 'string'},   // 所在的房间
            buytoken: {type: 'string'}  // 购买的 token
        });

        //exports.User.index({nickname: 1}).exec();

        db.Token = mongolass.model('Token', {
            token: {type: 'string'},
            userId: {type: 'string'},
            signTime: {type: 'date'},
            ipAddress: {type: 'string'},
            browser: {type: 'string'},
            priv: {type: 'number'}
        });

        db.LostAndFound = mongolass.model('LostAndFound', {
            phone: {type: 'string'},
            code: {type: 'string'},
            signTime: {type: 'date'}
        });

        exports.add_index(db.User, {id: 1}, true);
        exports.add_index(db.User, {nickname: 1});
        exports.add_index(db.Token, {userId: 1}, true);
        exports.add_index(db.Token, {token: 1}, true);
        exports.add_index(db.LostAndFound, {phone: 1}, true);

        connected.forEach(function (oneFn) {
            if (oneFn) {
                oneFn();
            }
        });

        return Q.all(index_operations);
    });

};


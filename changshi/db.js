const db = require(process.cwd() + '/auth').db;
exports.OnConnected =require(process.cwd() + '/auth').OnConnected;
const add_index = require(process.cwd() + '/auth').add_index;

const onConnect = function () {
    const mongolass = db.mongolass;

    //===============GYRO RELATED==================


    db.Gyro = mongolass.model('Gyro',{
        videoId: {type:'string'},   // video ID


        date:{type:'date'}          // Send date time

    });

    add_index(db.Gyro, {videoId:1});

};

exports.OnConnected(onConnect);
exports.db = db;

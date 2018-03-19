const MG = require('./db.js');
MG.OnConnected(function () {
    Gyro = MG.db.Gyro;
});
exports.setup = function (server) {

    // List all pays filter by: userId, date, reason, page, details
    server.add_get('/test', function (req, res) {
        return Gyro.insert({'videoId':'1234'}).exec().then(function () {
            console.log('12345')
            return {data:{aa:1}}
        })

    });



};
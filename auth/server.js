let base1 = require(process.cwd() + '/base');

let me = require('./index.js');
me.OnConnected(function () {
    console.log("Connected OK");
});
me.connectDB('mongodb://localhost:27017/db1');

let server = base1.setup_dev(['.'], 'GVR Auth Test Server 1.2');

server.listen(1234, '0.0.0.0', function () {
    console.log('Listening 1234');
    require('child_process').exec('open http://localhost:1234/help');

});


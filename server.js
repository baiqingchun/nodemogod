
require(process.cwd() + '/auth').connectDB('mongodb://localhost:27017/db5');

let server = require(process.cwd() + '/base').setup_dev(['.'],
        'GVR Server');

server.listen(1234, '0.0.0.0', function () {
    console.log('Listening 1234');
    //require('child_process').exec('open http://localhost:1234/help');

});


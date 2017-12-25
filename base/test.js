let me = require('./index');
let server = me.setup_custom_packages(['example'], 'GVR Server 1.2');

server.listen(1234, '0.0.0.0', function () {
    console.log('Listening 1234');
    require('child_process').exec('open http://localhost:1234/help');

});


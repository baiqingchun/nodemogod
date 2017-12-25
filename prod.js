
require(process.cwd() + '/auth').connectDB('mongodb://localhost:27017/db1');

let server = require(process.cwd() + '/base').setup_dev(['.'],
    { name: 'GVR Server', key_file: './certs/gvr.key', cert_file: './certs/gvr.crt', ca_file: './certs/gvr.root.crt'});

server.listen(443, '0.0.0.0', function () {
    console.log('Listening 443');
});

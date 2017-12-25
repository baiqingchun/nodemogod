
exports.setup = function (server) {
    server.add_get('/test', () => {
        return "hello, world";
    });

    server.add_get('/test2', () => {
        return { message:  "hello, pig."} ;
    });

    server.add_get('/testjpg', () => {
        return { file: __dirname + '/test.jpg'};
    });


};
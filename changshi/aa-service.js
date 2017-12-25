
exports.setup = function (server) {

    // List all pays filter by: userId, date, reason, page, details
    server.add_get('/test', function (req, res) {
       console.log('12345')
        return {data:{aa:1}}
    });



};
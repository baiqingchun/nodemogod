const request = require('request-promise');
const _msg = require(process.cwd() + '/base').msg;


exports.sendcode = function (phone, code) {
    let options = {
        method: 'POST',
        uri: "https://key.gvrcraft.com/sendsms/" + phone + "/" + code + "?gvr=1703",
        json: true // Automatically stringifies the body to JSON
    };

    return request(options).then(function (result) {
        if (result.code !== "200") {
            return _msg.fail('Send sms fail', 401);
        } else {
            return _msg.pass('Send sms OK');
        }
    });
};

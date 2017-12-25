const _msg = require('./msg.js');
const _file = require(process.cwd() + '/utils').file;
const path = require('path');

const fs = require('fs');

exports.responseJpg = function (res, data, req) {
    let content_type = 'image/jpeg';
    
    res.writeHead(200, {'Content-Type': content_type });
    res.end(data, 'binary');

    if (req) {
      console.log(data.length + ' sent for ' + req.url);
    }
    
    return true;
};

exports.responseFile = function (res, file) {
    if (!_file.isFile(file))
        return exports.response400(res);

    let content_type = 'binary/octet-stream';

    res.writeHead(200, {'Content-Type': content_type, 'Content-Disposition': 'attachment;filename=' + path.basename(file) });
    let data = fs.readFileSync(file);

    res.end(data, 'binary');

    return true;
};

exports.responseBin = function (res, data, type) {
    let content_type = 'binary/octet-stream';
    if (type)
        content_type = type;

    res.writeHead(200, {'Content-Type': content_type });
    res.end(data, 'binary');

    return true;
};


exports.responseHtml = function (res, html) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write(html);
    res.end();
    return true;
};

exports.responseText = function (res, msg, content_type) {
    if (!content_type)
        content_type = 'text/plain';

    res.writeHead(200, {'Content-Type':  content_type + '; charset=utf-8'});
    if (msg)
        res.write(msg);
    else
        res.write('OK.');

    res.end();
    return true;
};

exports.fnLogError = function(res) {
    return function(err) {
        let msg = err.toString();
        let list = msg.split(':');

        // Like Error: Error: 400:Hello, world

        let errCode = '500';
        if (list.length >= 2) {
            errCode = list[list.length - 2].trim();
            msg = list[list.length - 1].trim();
        }

        exports.responseError(res, msg, errCode);
    };
};


exports.responseError = function (res, errMsg, errorCode) {
    // 只能发一次
    if (res._header) { return; }

    if (!errorCode) { errorCode = 400; }
    let msg = _msg.getErrorDescription(errorCode);

    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    if (!errMsg) {
      errMsg = 'Failed';
    } else {
      console.log('Error: ' + errMsg);
    }

    res.write(JSON.stringify({code: '' + errorCode, message: errMsg}));
    res.end();
    return true;
};

exports.responseObj = function (res, obj, msg) {
    // 只能发一次
    if (res._header) { return; }

    if (!obj) {
        obj = {};
    }
  
    if (!msg) {
        msg = '';
    }

    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":"PUT,POST,GET,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Content-Length, Authorization, Accept,X-Requested-With"});
    res.write(JSON.stringify({ code:"", message: msg, data: obj}));
    res.end();

    return true;
};

exports.responseObjSimple = function (res, obj) {
    // 只能发一次
    if (res._header) { return; }

    if (!obj) {
        return exports.sendError(res, 'No exist');
    }

    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":"PUT,POST,GET,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Content-Length, Authorization, Accept,X-Requested-With"});
    res.write(JSON.stringify(obj));
    res.end();

    return true;
};

exports.response400 = function (res) {
    // 只能发一次
    if (res._header) { return; }

    res.writeHead(400, {'Content-Type': 'text/html; charset=utf-8',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":"PUT,POST,GET,DELETE,OPTIONS,HEAD"
    });
    res.write('400 Error');
    res.end();
};

exports.getBodyText = function (req, callback) {
    let data = '';
    req.on("data", function (trunk){
        data += trunk;
    });
    req.on("end", function () {
        callback(data);
    });
};

exports.getBodyBin = function (req, callback) {
    let chunks = [];
    req.on("data", function (trunk){
        chunks.push(trunk);
    });
    req.on("end", function () {
        let buffer = Buffer.concat(chunks);
        callback(buffer);
    });
};


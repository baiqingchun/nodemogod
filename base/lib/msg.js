exports.fnFail = function (reason, code) {
    return function (err) {
        return exports.fail(reason, code, err);
    };
};

exports.fail = function (reason, code, err) {
    if (code) {
        code = '' + code;
        if (code.length !== 3) {
            code = '500';
            if (err) {
                reason += ", " + err.toString();
            }
        }

        throw new Error(code + ':' + reason);
    } else {
        throw new Error(reason);
    }
};


exports.fnPass = function(msg, dat) {
    if (!msg) msg = "OK";
    if (!dat) dat = {};

    return function() {
        return { data: dat, message: msg};
    };
};

exports.pass = function (msg, dat) {
    if (!msg) msg = "OK";
    if (!dat) dat = {};

    return { data: dat, message: msg};
};

exports.getMsg = function (msg, dat, code) {
    if (code) {
        return { code: code, data: dat, message: msg};
    } else {
        return { data: dat, message: msg};
    }
};

exports.getMsgSimple = function (dat) {
    return { simple: true, data: dat };
};

exports.getMsgSimpleText = function (dat) {
    return { simpleText: true, data: dat };
};

exports.getErrorDescription = function(code) {
    if (code === 400)
        return "数据无效";
    else if (code === 401)
        return "申请失败";
    else if (code === 402)
        return "数据获取失败";
    else if (code === 403)
        return "校验失败";
    else if (code === 500)
        return "内部错误";
    else if (code === 0)
        return "";
    else
        return "错误" + code;
};

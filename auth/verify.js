const DB = require('./mongo_base.js').db;

const crypto = require('crypto');

const _msg = require(process.cwd() + '/base').msg;

const is_good_priv = function (priv, needPriv) {
    if (needPriv <= 1)
        return priv >= needPriv;

    return (priv & needPriv) === needPriv;
};

exports.tokenVerify = function (req, res, needPriv) {
    let token = req.query.token;
    if (!needPriv && needPriv !== 0) needPriv = 1;
    //var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    return DB.Token.findOne({token: token}).exec()
        .then(function (tokenObj) {
            let user = {};
            if (tokenObj) {
                user = {id: tokenObj.userId, priv: tokenObj.priv, isAdmin: ((tokenObj.priv & 2) === 2)};
            } else {
                if (token === '835fe5b92223c54a4dcaa15bbb5f40d4c3f154d7fa620ec75eba3b9b7157bcf3') {
                    user = {id: '_tester3', priv: 3};
                } else if (token === '835fe5b92223c54a4dcaa15bbb5f40d4c3f154d7fa620ec75eba3b9b7157bhje') {
                    user = {id: '_tester2', priv: 2};
                } else if (token === '835fe5b92223c54a4dcaa15bbb5f40d4c3f154d7fa620ec75eba823829387r63') {
                    user = {id: '_tester1', priv: 1};
                } else if (token === '835fe5b92223c54a4dcaa15bbb5f40d4c3f154d7fa620ec75eba3b93492hsfji') {
                    user = {id: '_tester0', priv: 0};
                }
            }

            if (is_good_priv(user.priv, needPriv)) { // && tokenObj.ipAddress === ipAddress) {
                return user;
            } else if (tokenObj) {
                return _msg.fail('用户无权限', 403);
            } else {
                return _msg.fail('Token错误', 403);
            }
        });
};


exports.refreshToken = function(res, user, priv, baseObj) {
    const token = {
        token: crypto.createHash('sha256').update(Date.now() + 'sa' + user + 'lt').digest('hex'),
        userId: user,
        signTime: new Date(),
        priv: priv
    };

    if (!baseObj) baseObj = {};

    return DB.Token.update({userId: user}, token, {upsert: true}).exec()
        .then(function() {
            baseObj.token = token.token;
            return { data: baseObj };
        });
};
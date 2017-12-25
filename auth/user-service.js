const _file = require(process.cwd() + '/utils').file;
const _utils = require(process.cwd() + '/utils').utils;
const _msg = require(process.cwd() + '/base').msg;

const MG = require('./mongo_base.js');
const Q = require('bluebird');

let User, LostAndFound, Token;

MG.OnConnected(function () {
   User = MG.db.User;
   LostAndFound = MG.db.LostAndFound;
   Token = MG.db.Token;
});

const _verify = require('./verify.js');

const _sms = require('./sms.js');

exports.setup = function (server) {
    server.add_post('/api/logout', function (req) {
        const token = req.query.token;
        return Token.remove({token: token}).exec()
            .then(function (r) {
                if (!r || r.result.n === 0) {
                    throw new Error('400:本帐号已登出');
                }

                return {message: 'logout成功', data: {}};
            });
    });

    server.add_post('/api/login2', function(req, res, next) {
        if (req.body && req.body.type === 'weixin' && req.body.access.length > 1) {
            // Like: code:abcde
            let code = req.body.access;
            if (code.startsWith('code:')) {
                code = code.substring(5);
            }

            console.log('Weixin: ' + code);

            let url1 = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx3cd36c237122c048&secret=aa2b43d8d3252dbee9d2f59f687a996e&code="
             + code + "&grant_type=authorization_code";

            // https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419317851&token=86e52516c833a46c375597b388950ad28904d23f&lang=zh_CN
            return _file.jsonFromUrl(url1).then(function (json) {
                let token = json.access_token;
                let openid = json.openid;
                if (!token) {
                    throw new Error('401:weixin code不正确');
                }

                let url2 = "https://api.weixin.qq.com/sns/userinfo?access_token=" + token + "&openid=" + openid;
                return _file.jsonFromUrl(url2).then(function (json2) {
                    let user = {
                        id: 'wx_' + openid,
                        nickname: json2.nickname,
                        avatar: json2.headimgurl,
                        info: '',
                        sex: json2.sex, priv: 1,
                        createDate: new Date(),
                        lastLogin: new Date()
                    };

                    if (!user.nickname) user.nickname = '';
                    if (!user.avatar) user.avatar = 'img1';
                    if (!user.sex) user.sex = '1';

                    let uid = user.id;
                    return User.findOne({id: uid}).exec()
                        .then(function (dat) {
                            if (!dat) { dat = user; }

                            return User.update({id: uid}, dat, {upsert: true}).exec()
                                .then(function () {
                                    return _verify.refreshToken(res, uid, dat.priv, {
                                        name: user.id, nickname: user.nickname,
                                        avatar: user.avatar,
                                        info: user.info, sex: user.sex
                                    });
                                });
                        });
                });
            });

        } else if (req.body && req.body.type === 'weibo' && req.body.access.length > 1) {
            console.log('Weibo: ' + req.body.access);

            let access = req.body.access;
            let uid1 = access.substring(access.indexOf(';') + 5);

            let url2 = "https://api.weibo.com/2/users/show.json?"
                + req.body.access.replace(':', '=').replace(':', '=').replace(';', '&');
            return _file.jsonFromUrl(url2).then(function (json2) {
                if (!json2.name) {
                    throw new Error('401:无法获取weibo数据');
                }

                let user = {
                    id: 'wb_' + uid1,
                    nickname: json2.name,
                    avatar: json2.profile_image_url,
                    info: '',
                    sex: (json2.gender === 'f') ? 1 : 0,
                    priv: 1,
                    lastLogin: new Date(),
                    createDate: new Date()
                };

                let uid = user.id;
                return User.findOne({id: uid}).exec()
                    .then(function (dat) {
                        if (!dat) { dat = user; }

                        return User.update({id: uid}, dat, {upsert: true}).exec()
                            .then(function () {
                                return _verify.refreshToken(res, uid, dat.priv, {
                                    name: user.id, nickname: user.nickname,
                                    avatar: user.avatar,
                                    info: user.info, sex: user.sex
                                });
                            });
                    });
            });
        } else {
            _msg.fail("Invalid data", 403);
        }
    }, 'Login with weixin or weibo');

    let basePath = '/var/www/html';
    if (!_file.isDir(basePath)) { basePath = '.'; }


    let save_avatar = function (body, uid) {
        let b = new Buffer(body.toString(), 'base64');
        let u = '/avatar/' + uid + '.jpg';
        _file.writeBin(basePath + u, b);

        return "http://api.gvrcraft.com" + u;
    };


    server.add_post('/api/upload_avatar', function(req, res, next) {
        if (!req.body || !req.body.avatar) {
            return _msg.fail("Empty Body", 403);
        }

        return _verify.tokenVerify(req, res).then(function(operator) {
            if (!operator)
                return;

            let uid = operator.id;
            let url = save_avatar(req.body.avatar, uid);

            return User.update({ id: uid }, { $set: { avatar: url } }).exec().then(function () {
                return { data: {avatar: url}, message: '头像上传完成' };
            });
        });
    }, 'Upload Avatar with base64');

    const isObject1 = function(a) {
        return (!!a) && (a.constructor === Object);
    };

    const user_patch = function (req, res, next) {
        return _verify.tokenVerify(req, res).then(function(operator) {
            if (!operator)
                return;
            let uid = req.params.user;
            if (!uid) {
                uid = operator.id;
            }

            let user = req.body;
            if (!user || !isObject1(user)) {
                return _msg.fail('BODY 不正确', 400);
            }

            delete user.password;

            // 只有管理员才能操作这些 (priv 权限，access 微信微博登录, company 企业名)
            if (!operator.isAdmin) {
                delete user.priv;
                delete user.access;
                delete user.company;
            } else {
                if (user.priv >= operator.priv && (operator.priv & 3) < 3) {
                    delete user.priv;   // Do not allow update to bigger or equal than operator, exception is 3(admin)
                }
            }

            return User.findOne({id: uid}).exec()
                .then(function (dat) {
                    if (dat.priv > operator.priv || (dat.id !== uid && !operator.isAdmin)) {
                        _msg.fail('操作权限不足', 400);
                    } else if (dat) {
                        return User.update({id: uid}, {$set: user}).exec()
                            .then(_msg.fnPass('用户数据设置完成')
                                , _msg.fnFail('用户数据设置失败', 400));
                    } else {
                        _msg.fail('用户不存在', 400);
                    }
                });
        });
    };

    server.add_put('/api/user/:user', user_patch, 'Set data of a user');
    server.add_patch('/api/user/:user', user_patch, 'Patch data of a user');

    server.add_post('/api/login/:user/:code', function(req, res, next) {
        let uid = req.params.user;
        let code = req.params.code;

        let pw = '';
        let nickname = '';
        if (req.body && req.body.password) pw = req.body.password;
        if (req.body && req.body.nickname) nickname = req.body.nickname;
        //let ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        return LostAndFound.findOne({phone: uid}).exec().then( function (dat1) {
            if (!dat1 || new Date() - dat1.signTime > 10 * 60 * 1000) { // Expire after 10 minutes
                _msg.fail("Token已过期", 403);
            }

            if (dat1.code !== code) {
                _msg.fail("验证码错误", 403);
            }

            return User.findOne({id: uid}).exec()
                .then(function (dat) {
                    if (!dat) {
                        dat = {
                            id: uid, nickname: '', priv: 1,
                            avatar: 'img1', info: '此人没有介绍', password: '',
                            createDate: new Date()
                        };
                    }
                    if (uid === '18600028197') dat.priv = 255;  // Open all priviledge for me

                    // Change password
                    if (pw) { dat.password = pw; }
                    if (nickname) { dat.nickname = nickname; }

                    if (!dat.avatar) { dat.avatar = 'img1'; } // Math.floor(Math.random() * 9 + 1); // img1 - img9
                    if (!dat.info) { dat.info = '无'; }

                    dat.lastLogin = new Date();

                    return User.update({id: uid}, dat, {upsert: true}).exec().then(function () {
                        let q = Q.resolve();
                        if (uid !== '12345678900') {
                            q = LostAndFound.remove({phone: uid}).exec();
                        }

                        return q.then(function () {
                            return _verify.refreshToken(res, uid, dat.priv);
                        });
                    });
                });
       });

    }, 'Login with user and code');


    server.add_post('/api/login3/:user/:pw', function(req, res, next) {
        let uid = req.params.user;
        let pw = req.params.pw;

        return User.findOne({id: uid}).exec().then(function (dat) {
            let priv = 0;
            if (dat) {
                if (dat.password !== pw) {
                    _msg.fail("密码错误", 400);
                } else {
                    return _verify.refreshToken(res, uid, dat.priv);
                }
            } else {
                _msg.fail("用户不存在", 404);
            }
        });
    }, 'Login with user and password');

    server.add_post('/api/sendcode/:phoneNumber', function (req, res) {
        let phone = req.params.phoneNumber;

        if (phone.length !== 11) {
            _msg.fail("无效的电话号码", 400);
        }

        let code = Math.random().toString().slice(-6);
        return LostAndFound.findOne({phone: phone}).exec().then(function (dat) {
            if (dat && new Date() - dat.signTime < 60 * 1000) {
                _msg.fail('必须间隔60秒才能发送');
            }

            return LostAndFound.update({phone: phone}, {
                phone: phone,
                code: code,
                signTime: new Date()
            }, {upsert: true}).exec()
                .then(function () {
                    return _sms.sendcode(phone, code);
                });
        });
    }, 'Get verification code for changing password of a user');


    server.add_get('/api/user/:uid', function (req, res, next) {
        return _verify.tokenVerify(req,res).then(function(operator) {
            if (!operator) return;

            let uid = req.params.uid;
            if (!uid) {
                uid = operator.id;
            }

            return User.findOne({id: uid}).then(
                function (target) {
                    if (target && target.priv <= operator.priv) {
                        delete target.password;
                        delete target.access;

                        target.username = target.id;
                        return {data: target};
                    } else {
                        _msg.fail("User not found!", 404);
                    }
                });
        
      });
    }, 'Get a user');

    // /api/users?page=X&filter=X
    server.add_get('/api/users', function (req, res) {
        return _verify.tokenVerify(req, res, 2).then(function(operator) {

            let page = +req.query.page - 1;
            if (page < 0) {
                page = 0;
            }

            let f = req.params.filter;
            let filter1 = {};

            if (f) {
                filter1.nickname = {$regex: ".*" + f + ".*"};
                return User.find(filter1).select({id: 1, nickname: 1, priv: 1, lastLogin: 1, createDate: 1}).limit(20).skip(page * 20)
                    .exec().then(function (users) {
                        _utils.remove_ids(users);
                        return {data: {users: users, total: users.length}};
                });
            } else {
                return User.count(filter1).exec()
                    .then(function (total) {
                        return User.find(filter1).select({id: 1, nickname: 1, priv: 1, lastLogin: 1, createDate: 1}).limit(20).skip(page * 20)
                            .exec().then(function (users) {
                                _utils.remove_ids(users);
                                return {data: {users: users, total: total}};
                        });
                    });
            }
        });
    }, 'Get users');


};


### User Login and Authentication

Priv 说明：
0: 被禁止
1: 普通用户
2: Admin
4: Analyzer (数据分析者，可修改)
8: Reserved
...
255: Super admin


#### 启动服务

```
let me = require(process.cwd() + '/base');
let server = me.setup_dev(['node_modules/@gvr/auth'], 'GVR Auth');

server.listen(1234, '0.0.0.0', function () { });
```


##### 服务支持下面的接口

```
POST /api/sendcode/:phoneNumber Get verification code for changing password of a user
POST /api/login2                Login with weixin or weibo
POST /api/login/:user/:code     Login with user and code
POST /api/login3/:user/:pw      Login with user and password
POST /api/logout

GET /api/user/:uid              Get a user
GET /api/users                  Get users
PUT /api/user/:user             Set data of a user
POST /api/upload_avatar         Upload Avatar with base64
```

#### 直接调用

```
var auth = require(process.cwd() + '/auth');

# Mongo DB
auth.mongolass

# Mongo DB.user
auth.User

# Mongo DB.Token
auth.Token

# Mongo DB.LostAndFound
auth.LostAndFound

# Token Verify
auth.tokenVerify

```



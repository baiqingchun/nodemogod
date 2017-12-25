## GVR Base Service

### Create Service

```
let server = require(process.cwd() + '/base').setup_dev(['node_modules/@gvr'], 'GVR Server');

server.listen(1234, '0.0.0.0', function () {
    console.log('Listening');
});

```

It will search all files: *-service.js in folder 'modules' and import them.

One example of *-service.js as the following.

#### test-service.js

```
exports.setup = function (server) {
    server.add_get('/test', () => {
        return { message: 'Set ok'};
    });

};
```

### HTTPS

PUT key file (.key), certificate file (.crt) and root certificate file into parameters of setup.

```
let server = require(process.cwd() + '/base').setup_dev(['node_modules/@gvr'], 'GVR Server',
    'gvrcraft.key', 'gvrcraft.crt', 'ca_root.crt');

server.listen(443, '0.0.0.0', function () {
    console.log('HTTPS Listening');
});

```

### 代码写法

在 modules 下放置 js 代码，入口文件为 "*-service.js"，内容类似:

exports.setup = function (server) {
    server.add_post('/api/test', function (req, res) {
        return { code: 200, message: 'logout成功', data: {}};
    });
};

可返回 Q, 返回值中 code 默认 200, message 默认 'OK'，data默认 {}。


可放置 *-service.md 文件表示这是上述js文件的说明文件。






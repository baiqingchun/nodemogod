// HTTP Server

const exec = require('child_process').exec;
const _file = require(process.cwd() + '/utils').file;

const _net = require('./net.js');

const restify = require('restify');

const _verify = require('../../auth/verify');

// const prettify = require('showdown-prettify');
// const showdown = require('showdown');
// const mdc = new showdown.Converter({extensions: ['prettify']});
//
exports.getMdHtml = function (file, show_file_noexist) {
    let r = show_file_noexist ? ("<div>NO " + file + "</div>") : '';

    if (_file.isFile(file)) {
        //r = mdc.makeHtml(_file.read(file));
        r = "<textarea style=\"width:90%; height: 100%; font-size: 1vmax\" readonly=true>" + _file.read(file) + "</textarea>";
    }

    return r;
};


const _dev = require('./dev_html.js');

let debug_mode = true;

const init_server = function (server, server_name) {
    server.use(restify.CORS());
    server.use(restify.bodyParser());
    server.use(restify.queryParser());
    server.use(restify.gzipResponse());

    const getMdHtml = exports.getMdHtml;

    const makeAPI_Html = function () {
        let html = '';

        server.g_api.forEach(function (one) {
           if (one.startsWith('::')) {
               let mdFile = one.substring(2);

               html += '<hr />' + getMdHtml(mdFile, false) + '<hr />';
           } else {
               html += one;
           }

           html += '<br />';
        });

        return html;
    };

    server.g_api = [];
    const send_help = function (res) {
        let readme_html = getMdHtml('README.md', true);

        let apiHtml = makeAPI_Html();

        _net.responseHtml(res,
            "<!DOCTYPE html>\n" +
            "<html><head>" +
            '<meta http-equiv="content-type" content="text/html;charset=utf-8">' +
            '<link rel="stylesheet" type="text/css" href="font-awesome.min.css">' +
            '<link rel="stylesheet" type="text/css" href="prettify.css">' +
            "</head><body>" +

            readme_html +

            "<div><h2>" + server_name + "</h2><div>API List:</div>" + apiHtml + "</div>"

            + "</body></html>"
        );
    };

    const do_response = function (res, r) {
        if (r === 'NA') return;

        if (typeof r === 'string') {
            _net.responseObjSimple(res, r);
        } else if (r.html) {
            _net.responseHtml(res, r.html);
        } else if (r.file) {
            _net.responseFile(res, r.file);
        } else if (r.simpleText) {
            _net.responseText(res, r.data)
        } else if (r.simple) {
            delete r.simple;

            _net.responseObjSimple(res, r.data);
        } else {
            if (!r.code) r.code = "200";
            if (!r.message) r.message = 'OK';
            if (!r.data) r.data = {};

            // { code:"", message: msg, data: obj}
            _net.responseObjSimple(res, {
                code: '' + r.code,
                message: '' + r.message,
                data: r.data
            });
        }
    };

    // fn1 应该返回 Q({code: code, message: '...', data: {...}})
    const add_method = function (method, path, fn1) {
        if (method !== 'get' && method !== 'put' && method !== 'del'
            && method !== 'post' && method !== 'patch') {
            throw new Error('Invalid Method ' + method);
        }

        server[method](path, function (req, res, next) {
            let r;

            try {
                r = fn1(req, res, next);
            } catch (ex) {
                _net.fnLogError(res)(ex);
                return;
            }

            if (!r) {
                _net.fnLogError(res)('No data return');
                return;
            }

            if (!r.then) {
                return do_response(res, r);
            }

            return r.then(function (rr) {
                return do_response(res, rr);
            }).catch(_net.fnLogError(res));
        });

    };

    server.add_get = function (path, fn1, description) {
        if (this.base_path)
            path = '/' + this.base_path + path;

        if (description)
            server.g_api.push('GET   ' + path + " \t " + description);
        else
            server.g_api.push('GET   ' + path);

        add_method('get', path, fn1);
    };

    server.add_put = function (path, fn1, description) {
        if (this.base_path)
            path = '/' + this.base_path + path;

        if (description)
            server.g_api.push('PUT   ' + path + " \t " + description);
        else
            server.g_api.push('PUT   ' + path);

        add_method('put', path, fn1);
    };

    server.add_patch = function (path, fn1, description) {
        if (this.base_path)
            path = '/' + this.base_path + path;

        if (description)
            server.g_api.push('PATCH ' + path + " \t " + description);
        else
            server.g_api.push('PATCH ' + path);

        add_method('patch', path, fn1);
    };

    server.add_post = function (path, fn1, description) {
        if (this.base_path)
            path = '/' + this.base_path + path;

        if (description)
            server.g_api.push('POST  ' + path + " \t " + description);
        else
            server.g_api.push('POST  ' + path);

        add_method('post', path, fn1);
    };

    server.add_delete = function (path, fn1, description) {
        if (this.base_path)
            path = '/' + this.base_path + path;

        if (description)
            server.g_api.push('DEL   ' + path + " \t " + description);
        else
            server.g_api.push('DEL   ' + path);

        add_method('del', path, fn1);
    };

    if (!debug_mode) return;

    server.get('/help', function (req, res, next) {
        return _verify.tokenVerify(req, res, 2).then(function () {
            send_help(res);
        }).catch(function () {
            _net.responseHtml(res, "<html><body>GVR API v1.1</body></html>");
        });
    });

    /*
    // /dev?filter=XXX&change=p1
    // /dev?filter=XXX&change=p1@1.03
    // /dev?filter=XXX&change=p1@NA
    // /dev/run
    // /dev/run/p1
    // /dev/publish/p1/1.03
    server.get('/dev', function (req, res) {
        let filter = req.query.filter;

        let html = _file.read(__dirname + '/dev.html');
        if (!filter) filter = '';

        html = html.replace('{{filter}}', filter);
        html = html.replace('{{package_list}}', _dev.getPackageList( filter ) );
        html = html.replace('{{md_list}}',     _dev.getMdFile());
        html = html.replace('{{next_version}}', _dev.next_version());

        _net.responseHtml(res, html);
    });

    server.post('/dev', function (req, res) {
        let filter = req.query.filter;
        let change = req.query.change;

        let html = _file.read(__dirname + '/dev.html');
        if (!filter) filter = '';

        html = html.replace('{{filter}}', filter);
        html = html.replace('{{package_list}}', _dev.getPackageList( filter, change ) );
        html = html.replace('{{md_list}}',     _dev.getMdFile(change));
        html = html.replace('{{next_version}}', _dev.next_version(change));

        _net.responseHtml(res, html);
    });

    server.get('/dev/files/:file', function (req, res) {
        let file = req.params.file;

        if (file === 'font-awesome.min.css' || file === 'prettify.css') {
            _net.responseText(res, _file.read(__dirname + '/files/' + file), 'text/css');
        } else if (file === 'jquery.min.js') {
            _net.responseText(res, _file.read(__dirname + '/files/' + file), 'application/x-javascript');
        } else {
            _net.response400(res);
        }

    });

    server.post('/dev/publish/:package/:version', function (req, res) {
        let package_name = req.params.package;
        let version = req.params.version;
        _dev.publish(package_name, version, res);
    });
*/
    server.post('/restart_gvr1703', function (req, res, next) {
        return _verify.tokenVerify(req, res, 2).then(function () {
            exec('git pull', function () {
                exec('npm i', function () {
                    _net.responseText(res, 'Code updated.');
                });
            });
        });
    });

};

const path = require('path');
const setupFile = function (file, server, custom_folder) {
    server.base_path = '';
    if (custom_folder) {
        let r = path.relative(custom_folder, file);

        if (r.substring(0, 3) === '../') {
            let ind = r.indexOf('/', r.indexOf('/') + 1);
            r = r.substring(ind + 1);
        }
        server.base_path = 'c/' + r.substring(0, r.indexOf('/'));
    }

    if (file[0] !== '/') {
        file = process.cwd() + '/' + file;
    }
    require(file).setup(server);

    let mdFile = file.replace('.js', '.md');
    if (_file.exists(mdFile)) {
        server.g_api.push('::' + mdFile);
    }
};

const fs = require('fs');

// options = { name: XXX, key_file: '/s.key', cert_file: '/s.cert', ca_file: '/ca.cert' }
const createServer = function (options) {
    if (!options.name) options.name = 'GVR';

    if (options.key_file) {
        options.key = fs.readFileSync(options.key_file);
    }

    if (options.cert_file) {
        options.certificate = fs.readFileSync(options.cert_file);
    }

    if (options.ca_file) {
        options.ca = fs.readFileSync(options.ca_file);
    }

    const server1 = restify.createServer(options);
    init_server(server1, options.name);

    return server1;
};

// options = { name: XXX, key_file: '/s.key', cert_file: '/s.cert', ca_file: '/ca.cert' }
exports.setup = function (setupFnList, options) {
    debug_mode = false;

    if (typeof options === 'string') {
        options = { name: options };
    }

    let server1 = createServer(options);


    setupFnList.forEach(function (oneFn) {
        oneFn(server1);
    });
};

// options = { name: XXX, key_file: '/s.key', cert_file: '/s.cert', ca_file: '/ca.cert' }
exports.setup_dev = function (folders, options) {
    debug_mode = true;

    if (typeof options === 'string') {
        options = { name: options };
    }

    let server1 = createServer(options);

    folders.forEach(function (oneFolder) {
        let files = _file.walk(oneFolder, '', ['node_modules', 'example']);
        files.forEach(function (oneFile) {
            if (oneFile.indexOf('-service.js') > 0) {
                setupFile(oneFile, server1, options.custom_folder ? oneFolder : '');
            } else if (oneFile.indexOf('README.md') >= 0 && oneFile !== './README.md') {
                // Include all README.md
                server1.g_api.push('::' + oneFile);
            }
        })
    });

    return server1;
};

exports.setup_custom_packages = function (folders, options) {
    if (typeof options === 'string') {
        options = { name: options };
    }

    options.custom_folder = true;
    return exports.setup_dev(folders, options);
};

exports.debug_mode = function () {
    return debug_mode;
};
const _net = require('./net');
const _file = require('../../utils').file;

// 当前正在编辑的packages 列表
let current_packages = {};

// packages 的version 列表，每个 package 有 current, last, list 三个值
let current_versions = {};

const get_current_version = function (name) {
    let json = _file.readJson('package.json');
    let trueName = '@gvr/' + name;

    let result = json.dependencies[trueName];
    if (!result)
        return '';

    if (result[0] === '^')
        result = result.substring(1);

    return result.trim();
};

const set_current_version = function (name, version) {
    let json = _file.readJson('package.json');
    let trueName = '@gvr/' + name;
    json.dependencies[trueName] = version;

    _file.writeJson('package.json', json, { spaces: 2 });

    _file.spawn('npm', ['i', '@gvr/' + name + '@' + version ]); // npm i @gvr/utils@1.2.0

    add_version(name, version, true);
};

const try_refresh_version = function (name, force) {
    if (!name || (current_versions[name] && !force))
        return;

    let result = _file.spawn('npm', [ 'view', '@gvr/' + name, 'versions']);
    if (result.status === 0) {
        let data = _file.spawnStdoutToString(result).replace(/\'/g, '"');
        let versions = JSON.parse(data);

        if (!current_versions[name]) {
            current_versions[name] = {};
        }

        current_versions[name].list = versions;

        current_versions[name].current = get_current_version(name);
    } else {
        console.log('ERROR in running: npm view @gvr/' + name + ' versions\n' + _file.spawnResultToString(result));
    }

};

const get_versions = function (package_name) {
    try_refresh_version(package_name, false);

    return current_versions[package_name]; //{current: '1.01', list: ['1.01', '1.02', '1.03']};
};

// 得到所有packages，删掉current_packages
const get_all_packages = function () {
    return _file.list('node_modules/@gvr');
};

const get_one_package_html = function (package_name, isActive, showing) {
    if (!package_name) return;

    let activeName = isActive ?  "Deactive" : "Active"; // "<i class=\"fa fa-close\"></i>" : '<i class="fa fa-check"></i>';
    let toParam = isActive ? (package_name + '@NA' ) : package_name;


    let link1 = "<a href=\"javascript:to('" + package_name + "@SHOW')\">"
        + package_name + "</a>";

    let result = "<button onclick=\"to('" + toParam + "')\">" + activeName
        + "</button>"
        + "<div class='sep2'>"
        + ((package_name === showing) ? (package_name + " (C)") : link1)
        + "</div>";

    let versions = get_versions(package_name);
    let current = versions.current;

    if (isActive) {
        result += "<select class='sep1' id='mod_" + package_name + "' onchange='change_version(this.id)'>";

        versions.list.forEach(function (one) {
            if (current === one) {
                result += '<option selected value="' + one + '" >' + one + '</option>';
            } else {
                result += '<option value="' + one + '" >' + one + '</option>';
            }
        });

        result += "</select>";
    } else {
        result += '<div class="sep1">' + current + '</div>'
    }
    return result;
};

const disable_editing = function (package_name) {
    if (!package_name) return;

    delete current_packages[package_name];

    _file.spawn('rm', [ 'editing/' + package_name ]);
};

const enable_editing = function (package_name, version) {
    current_packages[package_name] = version;
    set_current_version(package_name, version);

    if (!_file.isDir('editing')) {
        require('fs').mkdirSync('editing');
    }

    _file.spawn('rm', [ 'editing/' + package_name ]);
    _file.spawn('ln', ['-s', process.cwd() + '/node_modules/@gvr/' + package_name, 'editing/' + package_name ]);
};

exports.getPackageList = function ( filter, change ) {
    let showing = '';
    let version = '';
    if (change) {
        let names = change.split('@');
        showing = names[0];
        if (names.length > 0) {
            version = names[1];
        }
    }

    // 删除列表
    if (version === 'NA') {
        disable_editing(showing);
        showing = '';
    } else if (version === 'SHOW') {
        //showing = '';
    } else if (version) {
        enable_editing(showing, version);
    } else if (showing) {
        let v = get_versions(showing);
        enable_editing(showing, v.current);
    }

    let result = '';

    let part1 = '';
    for(let one in current_packages) {
        part1 += get_one_package_html(one, true, showing);
    }

    let part2 = '';
    let packages = get_all_packages();
    packages.forEach(function (one) {
        if (current_packages[one])
            return;

        if (filter && one.toLowerCase().indexOf(filter.toLowerCase()) < 0)
            return;

        part2 += get_one_package_html(one, false, showing);
    });

    if (part1) result += '<hr />' + part1;
    if (part2) result += '<hr />' + part2;

    return result + '<hr />';
};

exports.getMdFile = function (change) {
    let c = parse_change(change);
    let name = c.name;
    let version = c.version;

    let file = 'node_modules/@gvr/' + name + '/README.md';
    if (!name) {
        file = 'README.md';
    }

    let md_html;
    if (_file.exists(file)) {
        md_html = "<div><textarea style=\"width:100%; height: 100%; font-size: 1vmax\" readonly=true>" + _file.read(file) + "</textarea></div>";
    } else {
        md_html = '<div></div>'
    }

    return md_html + '<script>app_name="' + name +'"</script>';
};

const add_version = function (package_name, version, isCurrent) {
    if (!current_versions[package_name]) {
        current_versions[package_name] = { list: []};
    }

    let cv = current_versions[package_name];
    if (isCurrent) {
        cv.last = cv.current;
        cv.current = version;
    }

    if (cv.list.indexOf(version) < 0) {
        cv.list.push(version);
    }
};

exports.publish = function (package_name, version, res) {
    if (!package_name || !version) {
        _net.response400(res);
        return;
    }

    let folder = './node_modules/@gvr/' + package_name;

    if (!_file.isDir(folder)) {
        _net.response400(res);
        return;
    }

    let json_file = folder + '/package.json';

    let json = _file.readJson(json_file);
    delete json._from;
    delete json._resolved;
    json.version = version;

    _file.writeJson(json_file, json, { spaces: 2 });

    let result = _file.spawn('npm', [ 'publish', folder ]);

    let output = _file.spawnResultToString(result);
    if (result.status === 0) {
        _net.responseHtml(res, 'Published ' + package_name + ' with version: ' + version + '<br />'
            + output);

        current_packages[package_name] = version;

        add_version(package_name, version, true);

        enable_editing(package_name, version);
    } else {
        _net.responseHtml(res, 'Error in publishing ' + package_name + ' with version: ' + version + '<br />'
            + output);
    }
};

const parse_change = function (change) {
    let name = '';
    let version = '';
    if (change) {
        let names = change.split('@');
        name = names[0];
        if (names.length > 0) {
            version = names[1];
            if (version === 'NA')
                name = '';
        }
    }

    return {name: name, version: version};
};

exports.next_version = function (change) {
    let name = parse_change(change).name;

    if (!name) return '';

    let l = get_versions(name).list;
    if (l.length === 0)
        return "0.0.0";

    let result = l[l.length - 1];
    let parts = result.split('.');

    if (parts.length === 3) {
        return parts[0] + '.' + parts[1] + '.' + (+parts[2] + 1);
    } else {
        return "1.0.0";
    }
};
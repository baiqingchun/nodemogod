const fs = require('fs');
const fse = require('fs-extra');
const _request = require("request-promise");
const spawn = require('child_process').spawnSync;

// Example: spawn('python', [ __dirname + '/sms/sendsms.py', code, phone ]);
exports.spawn = spawn;

exports.jsonFromUrl = function (url) {
    return _request.get({ url: url, json: true});
};


exports.read = function(file) {
	return fs.readFileSync(file, 'utf8');
};

exports.readBin = function (file) {
    return fs.readFileSync(file);
};

exports.readJson = function(file) {
    return fse.readJsonSync(file);
};

exports.writeJson = function(file, obj, options) {
    return fse.writeJsonSync(file, obj, options);
};

exports.write = function(file, content) {
    if (file.indexOf('/') >= 0) {
        let folder = file.replace(/\/[^/]+$/, "");
        if (!exports.isDir(folder)) {
            fse.mkdirpSync(folder);
        }
    }
    
	return fs.writeFileSync(file, content, 'utf8');
};

exports.writeBin = function(file, content) {
    if (file.indexOf('/') >= 0) {
        let folder = file.replace(/\/[^/]+$/, "");
        if (!exports.isDir(folder)) {
            fse.mkdirpSync(folder);
        }
    }

    return fs.writeFileSync(file, content);
};


exports.list = function(dir, filter) {
    if (!exports.isDir(dir)) 
        return [];
    
	let result = fs.readdirSync(dir);
	if (filter) {
		result = result.filter(function(one) { 
			return one.indexOf(filter) === one.length - filter.length; 
		});
	}
	return result;
};

exports.read_internal_file = function (file) {
    return exports.read(__dirname + '/files/' + file);
};

exports.delete = function(file) {
    try {
        fs.unlinkSync(file);
    } catch (e) { return false; }
    
    return true;
};

exports.isDir = function(name) {
    try {
        var status = fs.lstatSync(name);
        if (status.isSymbolicLink()) {
            var name2 = fs.realpathSync(name);
            status = fs.lstatSync(name2);
        }
        return status.isDirectory();
    } catch (e) { return false; }
};

exports.isFile = function(name) {
    try {
        return fs.lstatSync(name).isFile();
    } catch (e) { return false; }
};

exports.isSymbolLink = function (name) {
    try {
        return fs.lstatSync(name).isSymbolicLink();
    } catch (e) {
        return false;
    }
};

exports.fromLink = function (name) {
    return fs.realpathSync(name);
};
            
exports.exists = function(name) {
    try {
        const l = fs.lstatSync(name);
        return l.isDirectory() || l.isFile();
    } catch (e) { return false; }
};

const WALK_MAX_LEVEL = 50;
const walk = function (dir, pattern, exclude_list, level) {
    if (!level) level = 0;
    if (level > WALK_MAX_LEVEL) return [];

    if (exports.isSymbolLink(dir)) {
        dir = exports.fromLink(dir);
    }

    let output = [];

    let files = fs.readdirSync(dir);
    files.forEach(function (one) {
        if (!one) return;

        if (exclude_list && exclude_list.indexOf(one) >= 0) {
            return;
        }

        let actual_dir = dir + '/' + one;
        if (exports.isDir(actual_dir)) {
            output = output.concat(walk(actual_dir, pattern, exclude_list, level + 1));
        } else {
            if (!pattern || one.indexOf(pattern) >= 0) {
                output.push(actual_dir);
            }
        }
    });

    return output;
};

exports.walk = walk;

exports.spawnResultToString = function (result) {
    return result.stdout.toString() + '\n<br />\n' + result.stderr.toString();
};

exports.spawnStdoutToString = function (result) {
    return result.stdout.toString();
};
var fs = require('fs');
var path = require('path');

var parser = require('../lib/parse');
var printer = require('../lib/print');
var convert = require('../lib/convert');

var NameTable = require('../lib/namespace').NameTable;

function mkdirPSync(p, mode) {
    var paths = [ ];
    var oldP;

    p = path.normalize(p);

    // Walk up the path.  We keep oldP around because the "root" may be /, an
    // empty string, or God-knows-what.
    do {
        oldP = p;
        paths.unshift(p);
        p = path.dirname(p);
    } while (p !== oldP);

    paths.forEach(function (dirPath) {
        if (!path.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, mode || 0755);
        }
    });
}

function convertProject(sourceDir, destDir, options) {
    var lastStep = 'initializing';

    function step(message) {
        lastStep = message;
        if (options.debug) {
            console.log(message);
        }
    }

    var nameTable = NameTable.create();

    var metadataJSON = options['metadata-json'] || path.join(__dirname, '..', 'dist', 'spaceport.json');
    var metadata = JSON.parse(fs.readFileSync(metadataJSON, 'utf8'));
    nameTable.add_metadata(metadata);

    if(options.swfj) {
        var swfj = JSON.parse(fs.readFileSync(options.swfj, 'utf8'));

        nameTable.add_classes(swfj.classData);

        // All globals and superclasses require explicit linkage
        function forceLinkage(name) {
            name.needs_linkage = true;
            if(name.class_scope && name.class_scope.super_name) {
                forceLinkage(name.class_scope.super_name);
            }
        }

        Object.keys(swfj.global).forEach(function(key) {
            var fqn = swfj.global[key];
            var name = nameTable.get_name_from_fqn(fqn);
            forceLinkage(name);
        });
    }

    var options = {
        read: function (filename) {
            step('reading ' + filename);
        },
        parse: function (filename) {
            step('parsing ' + filename);
        },
        parse_error: function (err, filename) {
            console.error('Error converting project while parsing ' + filename + ':');
            if (options.debug) {
                console.error(err.stack);
            } else {
                console.error(err.toString());
            }
        },
        build_exports: function (filename) {
            step(filename
                ? 'building exports from ' + filename
                : 'building exports'
            );
        },
        rewrite: function (filename) {
            step('converting ' + filename);
        },
        ignore_dot_files: options['ignore-dot-files']
    };
    var outputs;
    try {
        outputs = convert.project(sourceDir, nameTable, options);
    } catch (e) {
        console.error('Error converting project while ' + lastStep + ':');
        if (options.debug) {
            console.error(e.stack);
        } else {
            console.error(e.toString());
        }
        process.exit(1);
    }

    if (Object.keys(outputs).length === 0) {
        console.error('Could not find any .as files to convert');
        return false;
    }

    Object.keys(outputs).forEach(function (outputPath) {
        var ast = outputs[outputPath];

        try {
            var code = printer.gen_code(ast, { beautify: true });
            mkdirPSync(path.dirname(path.join(destDir, outputPath)));

            // writeFile (async) doesn't work too well because we end up
            // with lots of open file handles, which may make the operating
            // system (OS X) bitchy.
            fs.writeFileSync(path.join(destDir, outputPath), code, 'utf8');
        } catch (e) {
            console.error('Error while saving ' + outputPath + ':');
            console.error(e.toString());
            return false;
        }
    });

    return true;
}

exports.convertProject = convertProject;

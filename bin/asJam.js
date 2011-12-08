var fs = require('fs');
var path = require('path');

var optimist = require('optimist')
    .wrap(80)
    .usage('Usage: $0 [options] input-dir-or-file [output-dir]')
    .describe({
        'metadata-json':      'Use the given JSON Spaceport metadata file',
        'metadata-js':        'Use the given Spaceport metadata module',
        'ignore-dot-files':   'Ignore dot files'
    })
    .string([ 'metadata-json', 'metadata-js' ])
    .boolean([ 'ignore-dot-files' ])
    .default({
        'ignore-dot-files': false
    });

var argv = optimist.argv;

if (argv._.length !== 1 && argv._.length !== 2) {
    optimist.showHelp();
    process.exit(3);
}

var parser = require('../lib/parse');
var printer = require('../lib/print');
var convert = require('../lib/convert');

var NameTable = require('../lib/namespace').NameTable;

var sourceDir = argv._[0];
var destDir = argv._[1];

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

function getNameTable(metadata) {
    metadata = metadata || { };

    var nameTable = new NameTable();
    Object.keys(metadata.sp).forEach(function (className) {
        var classDef = metadata.sp[className];

        name = new printer.ExportName(className);
        name.get_ast = function() {
            return [ "dot", [ "name", "sp" ], this ];
        };
        name.needs_import = false;

        var classScope = new printer.ClassScope(className, classDef.super, null);
        name.class_scope = classScope;

        var proto = classDef.prototype;
        if (proto) {
            Object.keys(proto).map(function (memberName) {
                var member = proto[memberName];

                var nom = new printer.Name(memberName);
                nom.type = member.args ? 'Function' : member.type;
                return nom;
            }).forEach(function (nom) {
                classScope.define(nom);
            });
        }

        nameTable.add(classDef.package, name);
    });
    debugger;

    return nameTable;
}

var metadata = null;
if (argv['metadata-json']) {
    metadata = JSON.parse(fs.readFileSync(argv['metadata-json'], 'utf8'));
} else if (argv['metadata-js']) {
    metadata = require(process.cwd() + '/' + argv['metadata-js']);
}

if (destDir) {
    // Project
    var lastStep = 'initializing';

    var nameTable = getNameTable(metadata);
    var options = {
        read: function (filename) {
            lastStep = 'reading ' + filename;
        },
        parse: function (filename) {
            lastStep = 'parsing ' + filename;
        },
        parse_error: function (err, filename) {
            console.error('Error converting project while parsing ' + filename + ':');
            console.error(err.toString());
        },
        build_exports: function (filename) {
            lastStep = filename
                ? 'building exports from ' + filename
                : 'building exports';
        },
        rewrite: function (filename) {
            lastStep = 'converting ' + filename;
        },
        ignore_dot_files: argv['ignore-dot-files']
    };
    var outputs;
    try {
        outputs = convert.project(sourceDir, nameTable, options);
    } catch (e) {
        console.error('Error converting project while ' + lastStep + ':');
        console.error(e.toString());
        process.exit(1);
    }

    if (Object.keys(outputs).length === 0) {
        console.error('Could not find any .as files to convert');
        process.exit(2);
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
            process.exit(1);
        }
    });
} else {
    // One file
    fs.readFile(sourceDir, 'utf8', function (err, data) {
        var ast = parser.parse(data);
        ast = printer.rewrite(ast);
        var code = printer.gen_code(ast, { beautify: true });

        console.log(code);
    });
}

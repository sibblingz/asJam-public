#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var optimist = require('optimist')
    .wrap(80)
    .usage('Usage: $0 [options] input-dir-or-file [output-dir]')
    .describe({
        'metadata-json':      'Use the given JSON Spaceport metadata file',
        'metadata-js':        'Use the given Spaceport metadata module',
        'ignore-dot-files':   'Ignore dot files',
        'debug':              'Spew debug information'
    })
    .string([ 'metadata-json', 'metadata-js' ])
    .boolean([ 'ignore-dot-files' ])
    .default({
        'ignore-dot-files': false,
        'metadata-json': path.join(__dirname, '..', 'dist', 'spaceport.json')
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

var metadata = null;
if (argv['metadata-json']) {
    metadata = JSON.parse(fs.readFileSync(argv['metadata-json'], 'utf8'));
} else if (argv['metadata-js']) {
    metadata = require(path.resolve(process.cwd(), argv['metadata-js']));
}

if (destDir) {
    // Project
    var lastStep = 'initializing';

    function step(message) {
        lastStep = message;
        if (argv.debug) {
            console.log(message);
        }
    }

    var nameTable = NameTable.create(metadata);
    var options = {
        read: function (filename) {
            step('reading ' + filename);
        },
        parse: function (filename) {
            step('parsing ' + filename);
        },
        parse_error: function (err, filename) {
            console.error('Error converting project while parsing ' + filename + ':');
            if (argv.debug) {
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
        ignore_dot_files: argv['ignore-dot-files']
    };
    var outputs;
    try {
        outputs = convert.project(sourceDir, nameTable, options);
    } catch (e) {
        console.error('Error converting project while ' + lastStep + ':');
        if (argv.debug) {
            console.error(e.stack);
        } else {
            console.error(e.toString());
        }
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

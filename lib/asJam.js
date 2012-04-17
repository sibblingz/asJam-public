var fs = require('fs');
var path = require('path');

var parser = require('../lib/parse');
var printer = require('../lib/print');
var convert = require('../lib/convert');

var NameTable = require('../lib/NameTable');
var report = require('../lib/report');

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
    options = options || {};

    var reporter = options.reporter || new report.ConsoleReporter();
    reporter.step("init", "initializing");

    var nameTable = NameTable.create();

    var metadataJSON = options['metadata-json'] || path.join(__dirname, '..', 'dist', 'spaceport.json');
    var metadata = JSON.parse(fs.readFileSync(metadataJSON, 'utf8'));
    nameTable.add_metadata(metadata);

    if(options.swfj) {
        // All globals and superclasses require explicit linkage
        function forceLinkage(name) {
            name.needs_linkage = true;
            if(name.class_scope && name.class_scope.super_name) {
                forceLinkage(name.class_scope.super_name);
            }
        }

        // Make an array out of an array or a string
        var swfjPaths = [].concat(options.swfj);
        swfjPaths.forEach(function (swfjPath) {
            var swfj = JSON.parse(fs.readFileSync(swfjPath, 'utf8'));
            console.log('swfj', swfj);
            var names = nameTable.add_classes(swfj.classData);

            Object.keys(swfj.global).forEach(function(key) {
                var fqn = swfj.global[key];
                var name = nameTable.get_name_from_fqn(fqn);
                forceLinkage(name);
            });

            // Add merge mechanics to the name, for
            // art-matches-code scenarios
            function copyTo(other) {
                console.log('copying', this, 'to', other);
                other.needs_linkage = true;

                var tCS = this.class_scope;
                if(other.class_scope) {
                    var oCS = other.class_scope;
                    oCS.super_name = tCS.super_name;

                    tCS.names.forEach(function(name) {
                        oCS.define(name);

                        if(!(name.def_scope instanceof printer.ClassScope)) {
                            throw new Error("Internal error; oCS not a ClasSscope");
                        }
                    });
                } else {
                    other.class_scope = tCS;
                }
            }

            Object.keys(names).forEach(function(fqn) {
                var name = names[fqn];
                name.copyTo = copyTo;
            });
        });
    }

    var options = {
        reporter: reporter,
        ignore_dot_files: options['ignore-dot-files']
    };

    var outputs;
    try {
        outputs = convert.project(sourceDir, nameTable, options);
    } catch (e) {
        reporter.error("convert", e);
        process.exit(1);
    }

    if (Object.keys(outputs).length === 0) {
        reporter.error("find", "Could not find any .as files to convert");
        return false;
    }

    Object.keys(outputs).forEach(function (outputPath) {
        var ast = outputs[outputPath];

        var jsFilePath = path.join(destDir, outputPath);

        try {
            reporter.step(
                "write .js file",
                "writing " + jsFilePath,
                { filename: jsFilePath }
            );

            var code = printer.gen_code(ast, { beautify: true });
            mkdirPSync(path.dirname(path.join(destDir, outputPath)));

            // writeFile (async) doesn't work too well because we end up
            // with lots of open file handles, which may make the operating
            // system (OS X) bitchy.
            fs.writeFileSync(jsFilePath, code, 'utf8');
        } catch (e) {
            reporter.error("save", e);
            return false;
        }
    });

    return !reporter.hasError;
}

exports.convertProject = convertProject;

var fs = require('fs');
var path = require('path');

var parser = require('./parse');
var printer = require('./print');
var scc = require('./scc');

var NameTable = require('./namespace').NameTable;

function get_files(root, prefix, filter_func) {
        var children = fs.readdirSync(root);
        var files = [ ];

        children.forEach(function(filename) {
                var full_filename = path.join(root, filename);

                var stat = fs.statSync(full_filename);

                if (stat.isDirectory()) {
                        files = files.concat(get_files(full_filename, filename, filter_func));
                } else {
                        files.push(filename);
                }
        });

        files = files.filter(filter_func).map(function(filename) {
                return path.join(prefix, filename);
        });

        return files;
};

function getFakeName(filename) {
    var re = /\bcom\/adobe\/serialization\/json\/(JSONEncoder|JSONDecoder|JSONParseError|JSONToken|JSONTokenizer|JSONTokenType)\.as$/;
    var match = re.exec(filename);
    return match ? match[1] : null;
}

function getFakeFile(fakeName) {
    return fs.readFileSync(__dirname + '/fake/' + fakeName + '.as', 'utf8');
}

function project(root_path, name_table, options) {
        function callback(name, args) {
                options && options[name] && options[name].apply(null, args || [ ]);
        }

        name_table = name_table || new NameTable();

        var source_files = get_files(root_path, '', function(filename) {
                if (!/\.as$/.test(filename))
                        return false;
                if (/^\./.test(filename) && options && options.ignore_dot_files)
                        return false;

                return true;
        });

        var source_filenames = source_files.map(function(filename) {
                return path.join(root_path, filename);
        });

        // Read source files
        var sources = source_filenames.map(function(filename) {
            callback('read', [ filename ]);

            var fakeName = getFakeName(filename);
            if (fakeName) {
                return getFakeFile(fakeName);
            } else {
                return fs.readFileSync(filename, 'utf8');
            }
        });

        var converted_all = true;
        var source_asts = sources.map(function (source, i) {
                callback('parse', [ source_files[i] ]);
                try {
                        return parser.parse(source);
                } catch (e) {
                        converted_all = false;
                        callback('parse_error', [ e, source_files[i] ]);
                }
        });

        // Build exports
        callback('build_exports');
        if (!converted_all) {
                throw new Error("Parse error prevented project from being converted");
        }

        source_asts.forEach(function(ast, i) {
                var source_file = source_files[i];
                callback('build_exports', [ source_file ]);

                var exports = printer.get_exports(ast);
                exports.forEach(function(export_) {
                        var packageName = export_[0];
                        var name = export_[1];

                        if (name) {
                            name.export_path = source_file.replace(/\.as$/, '');
                            name_table.add(packageName, name);
                        } else {
                            name_table.get_package(packageName);
                        }
                });
        });

        // Rewrite
        var rewritten_asts = source_asts.map(function(ast, i) {
                callback('rewrite', [ source_files[i] ]);
                return printer.rewrite(ast, name_table);
        });

        // Build output object
        var output = {};

        rewritten_asts.forEach(function(ast, i) {
                var output_file = source_files[i].replace(/\.as$/, '.js');
                output[output_file] = ast;
        });

        // Create dependency graph
        var flatDeps = { }; // Map Dependant [Dependee]
        Object.keys(output).forEach(function (outputPath) {
            var ast = output[outputPath];
            var weights = printer.get_dependency_weights(ast);
            flatDeps[outputPath] = Object.keys(weights);
        });

        // Resolve circular dependencies
        var sccs = scc.findFlat(flatDeps);
        sccs.forEach(function (scc, idx) {
            if (scc.length === 1) {
                return;
            }

            // Circular dependency detected between modules in `scc`.
            // We create a new module which includes those modules,
            // then have the original module point to inside that new module.
            var asts = scc.map(function (name) {
                return output[name];
            });

            var moduleNames = scc.map(function (name) {
                return name.replace(/\.js$/g, '');
            });

            callback('cycles', [ moduleNames ]);

            var merged = printer.merge_modules(moduleNames, asts);
            var mergedName = "merged_" + idx;
            output[mergedName + ".js"] = merged;

            scc.forEach(function (name, i) {
                var newAst = [ "toplevel", [ [ "stat", [ "call", [ "name", "define" ], [
                    [ "array", [ [ "string", mergedName ] ] ],
                    [ "function", null, [ [ "merged" ] ], [
                        [ "stat", [ "return",
                            [ "sub", [ "name", "merged" ], [ "string", moduleNames[i] ] ]
                        ] ]
                    ] ]
                ] ] ] ] ];

                output[name] = newAst;
            });
        });

        return output;
};

exports.project = project;

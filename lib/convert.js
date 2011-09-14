var fs = require('fs');
var path = require('path');

var parser = require('../lib/parse');
var printer = require('../lib/print');

var NameTable = require('./namespace').NameTable;

function get_files(root, prefix, filter_func) {
        var files = fs.readdirSync(root);

        files.forEach(function(filename) {
                var full_filename = path.join(root, filename);

                var stat = fs.statSync(full_filename);

                if (stat.isDirectory()) {
                        files = files.concat(get_files(full_filename, filename, filter_func));
                }
        });

        files = files.filter(filter_func).map(function(filename) {
                return path.join(prefix, filename);
        });

        return files;
};

function project(root_path, name_table, options) {
        function callback(name, args) {
                options && options[name] && options[name].apply(null, args);
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
                return fs.readFileSync(filename, 'utf8');
        });

        var source_asts = sources.map(function (source, i) {
                callback('parse', [ source_files[i] ]);
                return parser.parse(source);
        });

        // Build exports
        source_asts.forEach(function(ast, i) {
                var source_file = source_files[i];
                callback('build_exports', [ source_file ]);

                var exports = printer.get_exports(ast);
                exports.forEach(function(export_) {
                        var namespace = export_[0];
                        var name = export_[1];
                        name.export_path = source_file.replace(/\.as$/, '');

                        name_table.add(export_[0], export_[1]);
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

        return output;
};

exports.project = project;

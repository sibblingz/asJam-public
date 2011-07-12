var fs = require('fs');
var path = require('path');

var parser = require('../lib/parse');
var printer = require('../lib/print');

var NameTable = require('./namespace').NameTable;

function get_as_files(root, prefix) {
        var files = fs.readdirSync(root);

        files.forEach(function(filename) {
                var full_filename = path.join(root, filename);

                var stat = fs.statSync(full_filename);

                if (stat.isDirectory()) {
                        files = files.concat(get_as_files(full_filename, filename));
                }
        });

        files = files.filter(function(filename) {
                return /\.as$/.test(filename);
        }).map(function(filename) {
                return path.join(prefix, filename);
        });

        return files;
};

function project(root_path, name_table) {
        name_table = name_table || new NameTable();

        var source_files = get_as_files(root_path);

        var source_filenames = source_files.map(function(filename) {
                return path.join(root_path, filename);
        });

        // Read source files
        var sources = source_filenames.map(function(filename) {
                return fs.readFileSync(filename, 'utf8');
        });

        var source_asts = sources.map(function (source, i) {
                console.log('Parsing %s', source_files[i]);
                return parser.parse(source);
        });

        // Build exports
        source_asts.forEach(function(ast, i) {
                console.log('Building exports for %s', source_files[i]);
                var source_file = source_files[i];

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
                console.log('Rewriting %s', source_files[i]);
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

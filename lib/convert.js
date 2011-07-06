var fs = require('fs');
var path = require('path');

var parser = require('../lib/parse');
var printer = require('../lib/print');

var NameTable = require('./namespace').NameTable;

function project(root_path) {
        // TODO recursive readdir
        var source_files = fs.readdirSync(root_path).filter(function(filename) {
                return /\.as$/.test(filename);
        })
        
        var source_filenames = source_files.map(function(filename) {
                return path.join(root_path, filename);
        });

        // Read source files
        var sources = source_filenames.map(function(filename) {
                return fs.readFileSync(filename, 'utf8');
        });

        var source_asts = sources.map(parser.parse);

        // Build exports
        var name_table = new NameTable();

        source_asts.forEach(function(ast, i) {
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
        var rewritten_asts = source_asts.map(function(ast) {
                return printer.rewrite(ast, name_table);
        });

        // Make code
        var outputs = rewritten_asts.map(printer.gen_code);

        // Build output object
        var output = {};

        outputs.forEach(function(output_source, i) {
                var output_file = source_files[i].replace(/\.as$/, '.js');
                output[output_file] = output_source;
        });

        return output;
};

exports.project = project;

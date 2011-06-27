var fs = require('fs');
var parser = require('../lib/parse');
var printer = require('../lib/print');

fs.readFile(process.argv[2], 'utf8', function (err, data) {
    var ast = parser.parse(data);
    ast = printer.rewrite(ast);
    var code = printer.gen_code(ast, { beautify: true });

    console.log(code);
});

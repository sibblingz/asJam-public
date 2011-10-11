(function (require) {
    // Node.JS is retarded and doesn't flush output streams when porcess.exit
    // is called.  We thus need to manually wait for the flushes to occur, then
    // exit.
    function waitStream(stream, callback) {
        if (stream.writable) {
            stream.on('close', function () {
                callback(null);
            });

            stream.on('error', function (err) {
                callback(err);
            });
        } else {
            // Already closed
            process.nextTick(function () {
                callback(null);
            });
        }
    }

    process.on('uncaughtException', function (e) {
        function log(e) {
            console.log(e && (e.stack || e.toString() || e));
        }

        log(e);

        var doneCount = 0;

        function check() {
            if (doneCount === 2) {
            }
        }

        function done(err) {
            if (err) log(err);
            ++doneCount;
            check();
        }

        waitStream(process.stdout, done);
        waitStream(process.stderr, done);
    });

    var fs = require('fs');
    var vm = require('vm');
    var path = require('path');

    var parser = require('../lib/parse');
    var printer = require('../lib/print');
    var convert = require('../lib/convert');

    var NameTable = require('../lib/namespace').NameTable;

    var codes = { };

    function load(sourceDir, vmContext) {
        var nameTable = new NameTable();
        var outputs = convert.project(sourceDir, nameTable);
        var scripts = { };

        Object.keys(outputs).forEach(function (outputPath) {
            var ast = outputs[outputPath];
            var code = printer.gen_code(ast, { beautify: true });

            codes[outputPath] = code;
            scripts[outputPath] = vm.createScript(code, outputPath);
        });

        vmContext.require.load = function (context, moduleName, url) {
            url = url.replace(/^\.\//, '');

            context.loaded[moduleName] = false;
            ++context.scriptCount;

            if (scripts[url]) {
                scripts[url].runInNewContext(vmContext);
                context.completeLoad(moduleName);
            } else {
                return vmContext.require.onError(new Error('No such module ' + url));
            }
        };
    }

    function run(vmContext) {
        vmContext.require([ 'Main' ], function (Main) {
            try {
                Main.run();
            } catch (e) {
                Object.keys(codes).forEach(function (key) {
                    console.log('===== ' + key);
                    console.log(codes[key]);
                });

                throw e;
            }
        });
    }

    var vmContext = {
        Array: Array,
        Date: Date,
        Number: Number,
        Object: Object,
        RegExp: RegExp,
        String: String,
    };

    vm.runInNewContext(
        fs.readFileSync(path.join(__dirname, 'require.js')),
        vmContext,
        'require.js'
    );

    vmContext.sp = require('../../spaceport/client/spaceport.js');

    load(path.join(__dirname, 'flex', 'src'), vmContext);
    run(vmContext);
}(require));

(function (require) {
    var options = {
        read:           console.log.bind(console, 'Reading'),
        parse:          console.log.bind(console, 'Parsing'),
        parse_error:    console.error.bind(console, 'Parse error'),
        build_exports:  console.log.bind(console, 'Building exports'),
        rewrite:        console.log.bind(console, 'Rewriting'),
    };

    // Node.JS is retarded and doesn't flush output streams when process.exit
    // is called.  We thus need to manually wait for the flushes to occur, then
    // exit.
    function waitStream(stream, callback) {
        if (stream.writable && process.versions.node < '0.6.0') {
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
                process.exit(1);
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

    var NameTable = require('../lib/NameTable');

    var SPACEPORT_PATH = path.join(__dirname, '..', 'dist', 'spaceport-node.js');
    if (process.argv.length === 3) {
        SPACEPORT_PATH = process.argv[2];
    }

    var codes = { };

    function load(sourceDir, vmContext) {
        var metadataJSON = path.join(__dirname, '..', 'dist', 'spaceport.json');
        var metadata = JSON.parse(fs.readFileSync(metadataJSON, 'utf8'));

        var nameTable = NameTable.create();
        nameTable.add_metadata(metadata);

        var outputs = convert.project(sourceDir, nameTable, options);
        var scripts = { };

        Object.keys(outputs).forEach(function (outputPath) {
            var ast = outputs[outputPath];
            var code = printer.gen_code(ast, { beautify: true });

            codes[outputPath] = code;
            scripts[outputPath] = vm.createScript(code, outputPath);
        });

        var unrequire = require('unrequire');
        unrequire.reconfigure({
            loadScriptSync: function (scriptName) {
                scriptName = scriptName.replace(/^\.\//, '');

                if (!scripts[scriptName]) {
                    throw new Error("No such module: " + scriptName);
                }

                var script = scripts[scriptName];
                script.runInNewContext(vmContext);
                return true;
            }
        });

        vmContext.define = unrequire.define;

        try {
            unrequire.require([ 'Main' ], function (Main) {
                Main.run();
            });
        } catch (e) {
            Object.keys(codes).forEach(function (key) {
                console.log('===== ' + key);
                console.log(codes[key]);
            });

            throw e;
        }
    }

    var sp = require(SPACEPORT_PATH);

    var vmContext = {
        console: console,
        setTimeout: setTimeout,
        setInterval: setInterval,
        process: process,

        sp: sp,

        Array: Array,
        Date: Date,
        Number: Number,
        Object: Object,
        RegExp: RegExp,
        String: String,

        // Include errors so instanceof works
        // http://es5.github.com/#x15.1.4.9
        Error: Error,
        EvalError: EvalError,
        RangeError: RangeError,
        ReferenceError: ReferenceError,
        SyntaxError: SyntaxError,
        TypeError: TypeError,
        URIError: URIError
    };

    load(path.join(__dirname, 'flex', 'src'), vmContext);
}(require));

var fs = require('fs');
var path = require('path');

var optimist = require('optimist')
    .wrap(80)
    .usage('Usage: $0 [options] input-dir-or-file [output-dir]')
    .describe({
        'metadata-json':      'Use the given JSON Spaceport metadata file',
        'metadata-js':        'Use the given Spaceport metadata module',
        'ignore-dot-files':   'Ignore dot files',
        'check-cycles':       'Check for ciruclar dependencies (requires unrequire)',
        'debug':              'Spew debug information'
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

    if (argv['check-cycles']) {
        var deps = { }; // Map Dependant (Map Dependee UseCount)
        var flatDeps = { }; // Map Dependant Dependee
        Object.keys(outputs).forEach(function (outputPath) {
            var ast = outputs[outputPath];
            var weights = printer.get_dependency_weights(ast);
            deps[outputPath] = weights;
            flatDeps[outputPath] = Object.keys(weights);
        });

        var hasOwn = Object.prototype.hasOwnProperty;

        function findCycles(graph, vertices) {
            function traverseDepthFirst(node, graph, visitedNodes){
                if (visitedNodes[node]) {
                    return [ node ];
                }
                visitedNodes[node] = true;
                var adjacentNodes = graph[node];
                for (var i = 0; i < adjacentNodes.length; i++) {
                    var cycle = traverseDepthFirst(adjacentNodes[i], graph, visitedNodes);
                    if (cycle) {
                        return [ node ].concat(cycle);
                    }
                }
                visitedNodes[node] = false;
                return null;
            }

            function simplifyCycle(stack){
                return alphabeticallySort(
                    stack.slice(stack.indexOf(stack[stack.length - 1]) + 1)
                );
            }

            function alphabeticallySort(stack){
                var least = stack[0];
                var index = 0;
                stack.forEach(function (temp, i) {
                    if (temp < least) {
                        least = temp;
                        index = i;
                    }
                });

                // Cycle left by index elements
                return stack.slice(index).concat(stack.slice(0, index));
            }

            var allCycles = { };
            Object.keys(graph).forEach(function (node) {
                var visitedNodes = { };
                var cycle = traverseDepthFirst(node, graph, visitedNodes);
                if (cycle) {
                    cycle = simplifyCycle(cycle);
                    allCycles[JSON.stringify(cycle)] = cycle;
                }
            });

            return Object.keys(allCycles).map(function (name) {
                return allCycles[name];
            });
        }

        var cycles = findCycles(flatDeps, Object.keys(outputs));
        cycles = cycles.filter(function (cycle) {
            return cycle.length > 1;
        });
        cycles.forEach(function (cycle) {
            var moduleWeights = [ ]; // [(ModuleName,UseCount)]
            cycle.forEach(function (module) {
                var weight = 0;
                Object.keys(deps).forEach(function (depName) {
                    var weights = deps[depName];
                    if (weights && weights[module]) {
                        weight += weights[module];
                    }
                });

                moduleWeights.push([ module, weight ]);
            });

            moduleWeights.sort(function (a, b) {
                if (a[1] > b[1]) {
                    return +1;
                } else if (a[1] < b[1]) {
                    return -1;
                } else {
                    return 0;
                }
            });

            var minModule = moduleWeights[0][0];
            var minModuleIndex = cycle.indexOf(minModule);
            var minModuleDependant = minModuleIndex === 0 ? cycle[cycle.length - 1] : cycle[minModuleIndex - 1];

            console.warn("");
            console.warn("Dependency cycle detected between the following modules:");
            console.warn("> " + cycle.join("\n> "));
            console.warn("We suggest you refactor " + minModuleDependant + " so it does not depend on " + minModule);
        });
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

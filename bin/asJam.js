#!/usr/bin/env node

var optimist = require('optimist')
    .wrap(80)
    .usage('Usage: $0 [options] input-dir/ output-dir/')
    .describe({
        'swfj':               'Use the given SWFJ file for art class information',
        'metadata-json':      'Use the given JSON Spaceport metadata file',
        'ignore-dot-files':   'Ignore dot files',
        'debug':              'Spew debug information'
    })
    .string([ 'metadata-json' ])
    .boolean([ 'ignore-dot-files' ])
    .default({
        'ignore-dot-files': false
    });

var argv = optimist.argv;

if (argv._.length !== 1 && argv._.length !== 2) {
    optimist.showHelp();
    process.exit(3);
}

var sourceDir = argv._[0];
var destDir = argv._[1];

require('../lib/asJam').convertProject(sourceDir, destDir, argv);

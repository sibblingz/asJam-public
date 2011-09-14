var fs = require('fs');
var path = require('path');

var optimist = require('optimist')
    .wrap(80)
    .describe({
        'defs':               'Use the given JSON Spaceport definition file',
        'ignore-dot-files':   'Ignore dot files'
    })
    .string([ 'defs' ])
    .boolean([ 'ignore-dot-files' ])
    .default({
        'ignore-dot-files': false
    });

var argv = optimist.argv;

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

function getNameTable(defs) {
    defs = defs || { };

    var sp = [
        [ "flash.display", "Bitmap" ],
        [ "flash.display", "BitmapData" ],
        [ "flash.display", "BitmapDataChannel" ],
        [ "flash.display", "BlendMode" ],
        [ "flash.display", "DisplayObject" ],
        [ "flash.display", "DisplayObjectContainer" ],
        [ "flash.display", "FrameLabel" ],
        [ "flash.display", "Graphics" ],
        [ "flash.display", "IBitmapDrawable" ],
        [ "flash.display", "Loader" ],
        [ "flash.display", "LoaderInfo" ],
        [ "flash.display", "MovieClip" ],
        [ "flash.display", "Shape" ],
        [ "flash.display", "SimpleButton" ],
        [ "flash.display", "Sprite" ],
        [ "flash.display", "Stage" ],
        [ "flash.display", "StageDisplayState" ],
        [ "flash.errors", "IOError" ],
        [ "flash.errors", "IllegalOperationError" ],
        [ "flash.events", "Event" ],
        [ "flash.events", "EventDispatcher" ],
        [ "flash.events", "FocusEvent" ],
        [ "flash.events", "HTTPStatusEvent" ],
        [ "flash.events", "IOErrorEvent" ],
        [ "flash.events", "KeyboardEvent" ],
        [ "flash.events", "MouseEvent" ],
        [ "flash.events", "ProgressEvent" ],
        [ "flash.events", "SecurityErrorEvent" ],
        [ "flash.events", "StatusEvent" ],
        [ "flash.events", "TextEvent" ],
        [ "flash.events", "TimerEvent" ],
        [ "flash.external", "ExternalInterface" ],
        [ "flash.filters", "BitmapFilter" ],
        [ "flash.filters", "BitmapFilterQuality" ],
        [ "flash.filters", "BlurFilter" ],
        [ "flash.filters", "ColorMatrixFilter" ],
        [ "flash.filters", "GlowFilter" ],
        [ "flash.geom", "ColorTransform" ],
        [ "flash.geom", "Matrix" ],
        [ "flash.geom", "Point" ],
        [ "flash.geom", "Rectangle" ],
        [ "flash.geom", "Transform" ],
        [ "flash.media", "Sound" ],
        [ "flash.media", "SoundChannel" ],
        [ "flash.media", "SoundLoaderContext" ],
        [ "flash.media", "SoundMixer" ],
        [ "flash.media", "SoundTransform" ],
        [ "flash.net", "LocalConnection" ],
        [ "flash.net", "SharedObject" ],
        [ "flash.net", "URLLoader" ],
        [ "flash.net", "URLRequest" ],
        [ "flash.net", "URLRequestMethod" ],
        [ "flash.net", "URLVariables" ],
        [ "flash.net", "navigateToURL" ],
        [ "flash.profiler", "showRedrawRegions" ],
        [ "flash.sampler", "StackFrame" ],
        [ "flash.sampler", "getInvocationCount" ],
        [ "flash.system", "ApplicationDomain" ],
        [ "flash.system", "Capabilities" ],
        [ "flash.system", "LoaderContext" ],
        [ "flash.system", "Security" ],
        [ "flash.system", "SecurityPanel" ],
        [ "flash.system", "System" ],
        [ "flash.text", "AntiAliasType" ],
        [ "flash.text", "Font" ],
        [ "flash.text", "StyleSheet" ],
        [ "flash.text", "TextField" ],
        [ "flash.text", "TextFieldAutoSize" ],
        [ "flash.text", "TextFieldType" ],
        [ "flash.text", "TextFormat" ],
        [ "flash.text", "TextFormatAlign" ],
        [ "flash.ui", "Keyboard" ],
        [ "flash.ui", "Mouse" ],
        [ "flash.utils", "ByteArray" ],
        [ "flash.utils", "Dictionary" ],
        [ "flash.utils", "Endian" ],
        [ "flash.utils", "Proxy" ],
        [ "flash.utils", "Timer" ],
        [ "flash.utils", "clearInterval" ],
        [ "flash.utils", "describeType" ],
        [ "flash.utils", "flash_proxy" ],
        [ "flash.utils", "getDefinitionByName" ],
        [ "flash.utils", "getQualifiedClassName" ],
        [ "flash.utils", "getTimer" ],
        [ "flash.utils", "setInterval" ],
    ];

    var nameTable = new NameTable();

    sp.forEach(function (sp) {
        var namespace = sp[0];
        var className = sp[1];

        name = new printer.ExportName(className);
        name.get_ast = function() {
            return [ "dot", [ "name", "sp" ], this ];
        };
        name.needs_import = false;

        if (Object.prototype.hasOwnProperty.call(defs, className)) {
            var def = defs[className];
            var classScope = new printer.ClassScope(className, def.superClass, null);
            name.class_scope = classScope;

            var memberNames = def.members.map(function (member) {
                var memberName = new printer.Name(member.name);
                memberName.type = member.type;
                return memberName;
            });

            memberNames.forEach(classScope.define, classScope);
        }

        nameTable.add(namespace, name);
    });

    return nameTable;
}

var defs = null;

if (argv.defs) {
    defs = JSON.parse(fs.readFileSync(argv.defs, 'utf8'));
}

if (destDir) {
    // Project
    var nameTable = getNameTable(defs);
    var outputs = convert.project(sourceDir, nameTable, {
        read: function (filename) {
            //console.log('Reading', filename);
        },
        parse: function (filename) {
            //console.log('Parsing', filename);
        },
        build_exports: function (filename) {
            //console.log('Building exports from', filename);
        },
        rewrite: function (filename) {
            //console.log('Rewriting', filename);
        },
        ignore_dot_files: argv['ignore-dot-files']
    });

    Object.keys(outputs).forEach(function (outputPath) {
        var ast = outputs[outputPath];
        //console.log('Dumping to %s', outputPath);

        var code = printer.gen_code(ast, { beautify: true });
        mkdirPSync(path.dirname(path.join(destDir, outputPath)));

        // writeFile (async) doesn't work too well because we end up
        // with lots of open files, which may make the operating
        // system (OSX) bitchy.
        fs.writeFileSync(path.join(destDir, outputPath), code, 'utf8');
        //console.log('Wrote %s', outputPath);
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

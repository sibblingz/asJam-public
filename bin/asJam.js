var fs = require('fs');
var path = require('path');

var parser = require('../lib/parse');
var printer = require('../lib/print');
var convert = require('../lib/convert');

var NameTable = require('../lib/namespace').NameTable;

var sourceDir = process.argv[2];
var destDir = process.argv[3];

function mkdirPSync(p, mode) {
    p = path.normalize(p);
    var pathParts = p.split('/');

    for (var i = 0; i < pathParts.length; ++i) {
        var dirPath = path.join.apply(path, pathParts.slice(0, i + 1));

        if (!path.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, mode || 0755);
        }
    }
}

if (destDir) {
    // Project
    var nameTable = new NameTable();
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

    sp.forEach(function (sp) {
        var namespace = sp[0];
        var name = sp[1];

        nameTable.add(namespace, new printer.Name(name));
    });

    var outputs = convert.project(sourceDir, nameTable);

    Object.keys(outputs).forEach(function (outputPath) {
        var ast = outputs[outputPath];
        console.log('Dumping to %s', outputPath);
        var code = printer.gen_code(ast, { beautify: true });
        mkdirPSync(path.dirname(path.join(destDir, outputPath)));

        fs.writeFile(path.join(destDir, outputPath), code, 'utf8', function (err) {
            if (err) throw err;

            console.log('Wrote %s', outputPath);
        });
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

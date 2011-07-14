var path = require('path');
var spFilename = path.resolve(process.argv[2]);
var sp = require(spFilename);

var output = { };

for (var klassName in sp) {
    var klass = {
        name: klassName,
        members: [ ]
    };

    for (var key in sp[klassName].prototype) {
        try {
            klass.members.push({
                name: key,
                type: typeof sp[klassName].prototype[key] === 'function' ? 'Function' : null
            });
        } catch (e) {
            console.warn(e.toString());
        }
    }

    output[klassName] = klass;
}

console.log(JSON.stringify(output));

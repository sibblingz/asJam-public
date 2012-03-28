var printer = require('./print');

// Taken from spaceport-metadata/lib/mutil.js
// fn => function( value, path, obj )
// such that descend( obj, path ) === value
// and obj[ path[ path.length - 1 ] ] === value
function deepForEach( obj, fn, ctx ){
    function deepForEachImpl( obj, path ){
        Object.keys( obj ).forEach( function( key ){
            var newPath = path.concat( [key] );
            var val = obj[ key ];
            if( val && typeof val === "object" ){
                deepForEachImpl( val, newPath );
            }else{
                fn.call( ctx, val, newPath, obj );
            }
        });
    }

    deepForEachImpl( obj, [] );
}

function parseFQN(fqn) {
    var match = /^(.*)::(.*)$/.exec(fqn);
    var packageName, className;
    if(match) {
        return {
            package: match[1],
            class: match[2]
        }
    } else {
        return {
            package: '',
            class: fqn
        };
    }
}

function NameTable() {
    this.packages = {};
};

NameTable.prototype.create_package = function create_package(packageName) {
    if (!HOP(this.packages, packageName)) {
        this.packages[packageName] = [];
    }
};

NameTable.prototype.get_package = function get_package(packageName) {
    if (!HOP(this.packages, packageName)) {
        throw new Error("Could not find package " + (packageName || "(empty)"));
    }

    return this.packages[packageName];
};

NameTable.prototype.add = function(packageName, name) {
    this.create_package(packageName);
    var packageBody = this.get_package(packageName);

    // Check for existing names
    for(var i = 0; i < packageBody.length; ++i) {
        var curName = packageBody[i];
        if(curName == String(name)) {
            // Name already exists
            packageBody.splice(i, 1);
            --i;

            // Merge if possible
            if(typeof curName.copyTo === 'function') {
                curName.copyTo(name);
            }

            // Override; new name takes precedence
        }
    }

    packageBody.push(name);
};

NameTable.prototype.get_names = function(import_string) {
        var re = /^(.*)\.(.*)$/;
        var e = re.exec(import_string);

        var packageName, name;

        if (e) {
                packageName = e[1];
                name = e[2];
        } else {
                packageName = "";
                name = import_string;
        }

        var packageBody = this.get_package(packageName);

        if (name == "*") {
                return packageBody;
        }

        for (var i = 0; i < packageBody.length; ++i) {
                if (packageBody[i] == name) {
                        return [ packageBody[i] ];
                }
        }

        throw new Error("Could not resolve import " + import_string);
};

NameTable.prototype.get_names_in_package = function(packageName) {
        if (!HOP(this.packages, packageName)) {
                return [];
        }

        return this.packages[packageName].slice();
};

NameTable.prototype.get_global_package_names = function get_global_package_names() {
    return Object.keys(this.packages).map(function (packageName) {
        return packageName.split('.')[0];
    }).filter(function (packageName) {
        return packageName;
    });
};

NameTable.prototype.get_name_from_fqn = function get_name_from_fqn(fqn) {
    var n = parseFQN(fqn);

    var packageBody = this.packages[n.package];
    if(!packageBody) {
        return null;
    }

    for(var i = 0; i < packageBody.length; ++i) {
        var name = packageBody[i];
        if(name == n.class) {
            return name;
        }
    }

    return null;
};

// [ "foo", "bar", "Baz", "blah" ]
//   ppppp  ppppp  ccccc  rrrrrr
// p = package
// c = class or other export
// r = property
//
// => [ Baz export name, [ "blah" ], [ "foo", "bar" ] ]
NameTable.prototype.get_name_from_maybe_fqn = function get_name_from_maybe_fqn(fqn_array) {
    var i = fqn_array.length;
    while (i --> 0) {
        // Search backwards for packages

        var package_name = fqn_array.slice(0, i).join('.');
        if (!HOP(this.packages, package_name)) {
            continue;
        }
        var exports = this.packages[package_name];

        // Find the exported name
        var j;
        for (j = i; j < fqn_array.length; ++j) {
            var k;
            for (k = 0; k < exports.length; ++k) {
                if (String(exports[k]) === String(fqn_array[j])) {
                    // Found a match
                    return [
                        exports[k],
                        fqn_array.slice(j + 1),
                        fqn_array.slice(0, i)
                    ];
                }
            }
        }

        // Didn't find a match; try one package up
    }

    return null;
};

NameTable.prototype.add_classes = function add_classes(classesData) {
    var objectName = this.get_name_from_fqn("::Object");

    var queue = Object.keys(classesData);
    var names = { };

    function get(fqn) {
        if(!Object.prototype.hasOwnProperty.call(names, fqn)) {
            processQueueItem(fqn);
        }
        return names[fqn];
    }

    var nameTable = this;
    function processQueueItem(fqn) {
        var index = queue.indexOf(fqn);
        if(index < 0) {
            return;
        }
        queue.splice(index, 1);

        var classDef = classesData[fqn];

        var n = parseFQN(fqn);

        var name = new printer.ExportName(n.class);
        var superName = classDef.super && classDef.super[0] ? get(classDef.super[0]) : objectName;
        var classScope = new printer.ClassScope(fqn, superName, null);
        name.class_scope = classScope;

        var proto = classDef.prototype;
        if(proto) {
            Object.keys(proto).map(function (memberName) {
                var member = proto[memberName];

                var nom = new printer.Name(memberName);
                nom.type = member.args ? 'Function' : member.type || objectName;
                return nom;
            }).forEach(function (nom) {
                classScope.define(nom);
            });
        }

        nameTable.add(n.package, name);
        names[fqn] = name;
    }

    while(queue.length) {
        processQueueItem(queue[0]);
    }

    return names;
};

NameTable.prototype.add_metadata = function add_metadata(metadata) {
    if(metadata.sp) {
        throw new Error("Old version of metadata detected");
    }

    this.add_classes(metadata.classData);

    deepForEach(metadata.global, function(value, path) {
        var name = this.get_name_from_fqn(value);
        var node = [
            "dot",
            [ "name", path[0] ]
        ].concat(path.slice(1))

        name.get_ast = function() {
            return node;
        };
        name.needs_import = false;
    }, this);
};

NameTable.create = function create() {
    var nameTable = new NameTable();

    var objectName = new printer.ExportName('Object');
    objectName.needs_import = false;
    objectName.is_global = true;
    var classScope = new printer.ClassScope(objectName, null, null);
    objectName.class_scope = classScope;
    [
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        'constructor',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toLocaleString',
        'toString',
        'valueOf'
    ].forEach(function (name) {
        classScope.define(new printer.Name(name));
    });
    nameTable.add('', objectName);

    return nameTable;
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

module.exports = NameTable;

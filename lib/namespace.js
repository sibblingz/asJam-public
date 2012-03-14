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
    this.namespaces = {};
};

NameTable.prototype.add = function(namespace, name) {
    if (!HOP(this.namespaces, namespace)) {
        this.namespaces[namespace] = [];
    }

    var packageBody = this.namespaces[namespace];

    // Check for existing names
    for(var i = 0; i < packageBody.length; ++i) {
        var tname = packageBody[i];
        if(tname == String(name)) {
            // XXX Omega turd hack
            packageBody.splice(i, 1);
            --i;
            name.needs_linkage = name.needs_linkage || tname.needs_linkage;
        }
    }

    packageBody.push(name);
};

NameTable.prototype.get_names = function(import_string) {
        var re = /^(.*)\.(.*)$/;
        var e = re.exec(import_string);

        var namespace, name;

        if (e) {
                namespace_name = e[1];
                name = e[2];
        } else {
                namespace_name = "";
                name = import_string;
        }

        if (!HOP(this.namespaces, namespace_name)) {
                throw new Error("Namespace " + (namespace_name || "(empty)") + " not defined");
        }

        var namespace = this.namespaces[namespace_name];

        if (name == "*") {
                return namespace;
        }

        for (var i = 0; i < namespace.length; ++i) {
                if (namespace[i] == name) {
                        return [ namespace[i] ];
                }
        }

        throw new Error("Could not resolve import " + import_string);
};

NameTable.prototype.get_names_in_namespace = function(namespace_name) {
        if (!HOP(this.namespaces, namespace_name)) {
                return [];
        }

        return this.namespaces[namespace_name].slice();
};

NameTable.prototype.get_global_package_names = function get_global_package_names() {
    return Object.keys(this.namespaces).map(function (namespaceName) {
        return namespaceName.split('.')[0];
    }).filter(function (namespaceName) {
        return namespaceName;
    });
};

NameTable.prototype.get_name_from_fqn = function get_name_from_fqn(fqn) {
    var n = parseFQN(fqn);

    var packageBody = this.namespaces[n.package];
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
// => [ Baz export name, [ "blah" ] ]
NameTable.prototype.get_name_from_maybe_fqn = function get_name_from_maybe_fqn(fqn_array) {
    var i = fqn_array.length;
    while (i --> 0) {
        // Search backwards for packages

        var package_name = fqn_array.slice(0, i).join('.');
        if (!HOP(this.namespaces, package_name)) {
            continue;
        }
        var exports = this.namespaces[package_name];

        // Find the exported name
        var j;
        for (j = i; j < fqn_array.length; ++j) {
            var k;
            for (k = 0; k < exports.length; ++k) {
                if (String(exports[k]) === String(fqn_array[j])) {
                    // Found a match
                    return [ exports[k], fqn_array.slice(j + 1) ];
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
                nom.type = member.args ? 'Function' : member.type;
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

exports.NameTable = NameTable;

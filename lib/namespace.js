var printer = require('./print');

// Taken frmo spaceport-metadata/lib/mutil.js
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

// Taken from spaceport-metadata/lib/metadata.js
function createFQNLookup( global ){
    var fqnLookup = Object.create( null );
    deepForEach( global, function( value, path ){
        fqnLookup[ value ] = [
            "dot",
            [ "name", path[0] ]
        ].concat(path.slice(1));
    });

    return fqnLookup;
}

function NameTable() {
        this.namespaces = {};
};

NameTable.prototype.add = function(namespace, name) {
        if (!HOP(this.namespaces, namespace)) {
                this.namespaces[namespace] = [];
        }

        this.namespaces[namespace].push(name);
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

NameTable.create = function create(metadata) {
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

    if (!metadata) {
        return nameTable;
    }

    if (metadata.sp) {
        throw new Error("Old version of metadata.json detected; please update it!");
    }

    var global = metadata.global;
    var fqnLookup = createFQNLookup(global);

    var classData = metadata.classData;
    var queue = Object.keys(classData);
    var names = { };

    function get(fqn) {
        if (!Object.prototype.hasOwnProperty.call(names, fqn)) {
            processQueueItem(fqn);
        }
        return names[fqn];
    }

    function processQueueItem(fqn) {
        queue.splice(queue.indexOf(fqn), 1);

        var classDef = classData[fqn];

        var name = new printer.ExportName(fqn.replace(/^.*::/, ''));
        name.get_ast = function() {
            return fqnLookup[fqn];
        };
        name.needs_import = false;

        var superName = classDef.super && classDef.super[0] ? get(classDef.super[0]) : objectName;
        var classScope = new printer.ClassScope(fqn, superName, null);
        name.class_scope = classScope;

        var proto = classDef.prototype;
        if (proto) {
            Object.keys(proto).map(function (memberName) {
                var member = proto[memberName];

                var nom = new printer.Name(memberName);
                nom.type = member.args ? 'Function' : member.type;
                return nom;
            }).forEach(function (nom) {
                classScope.define(nom);
            });
        }

        var namePackage = fqn.replace(/::.*$/, '');
        nameTable.add(namePackage, name);
        names[fqn] = name;
    }

    while (queue.length) {
        processQueueItem(queue[0]);
    }

    return nameTable;
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

exports.NameTable = NameTable;

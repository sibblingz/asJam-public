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

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

exports.NameTable = NameTable;

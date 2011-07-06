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

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

exports.NameTable = NameTable;

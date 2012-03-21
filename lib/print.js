/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file implements some AST processors.  They work on data built
  by parse-js.

  Exported functions:

    - ast_mangle(ast, options) -- mangles the variable/function names
      in the AST.  Returns an AST.

    - ast_squeeze(ast) -- employs various optimizations to make the
      final generated code even smaller.  Returns an AST.

    - gen_code(ast, options) -- generates JS code from the AST.  Pass
      true (or an object, see the code for some options) as second
      argument to get "pretty" (indented) code.

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

var SUPER_OF_CTOR = false;

var jsp = require("./parse"),
    slice = jsp.slice,
    member = jsp.member,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;

/* -----[ helper for AST traversal ]----- */

function ast_walker(ast) {
        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(def){
                        return [ def[0], walk(def[1]), def[2] ];
                }) ];
        };

        function _block(statements) {
                var out = [ this[0] ];
                if (statements != null)
                        out.push(MAP(statements, walk));
                return out;
        };

        function _lambda(name, args, body, returnType, modifiers) {
                return [ this[0], name, args.slice(), body ? MAP(body, walk) : null, returnType, modifiers ? modifiers.slice() : null ];
        };

        var walkers = {
                "string": function(str) {
                        return [ this[0], str ];
                },
                "num": function(num) {
                        return [ this[0], num ];
                },
                "name": function(name) {
                        return [ this[0], name ];
                },
                "toplevel": function(statements) {
                        return [ this[0], MAP(statements, walk) ];
                },
                "block": _block,
                "splice": _block,
                "var": _vardefs,
                "const": _vardefs,
                "astry": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                c != null ? MAP(c, function(cc){
                                        return [ cc[0], MAP(cc[1], walk) ];
                                }) : null,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "try": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                c != null ? [ c[0], MAP(c[1], walk) ] : null,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "throw": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "new": function(ctor, args) {
                        return [ this[0], walk(ctor), MAP(args, walk) ];
                },
                "switch": function(expr, body) {
                        return [ this[0], walk(expr), MAP(body, function(branch){
                                return [ branch[0] ? walk(branch[0]) : null,
                                         MAP(branch[1], walk) ];
                        }) ];
                },
                "break": function(label) {
                        return [ this[0], label ];
                },
                "continue": function(label) {
                        return [ this[0], label ];
                },
                "conditional": function(cond, t, e) {
                        return [ this[0], walk(cond), walk(t), walk(e) ];
                },
                "assign": function(op, lvalue, rvalue) {
                        return [ this[0], op, walk(lvalue), walk(rvalue) ];
                },
                "dot": function(expr) {
                        return [ this[0], walk(expr) ].concat(slice(arguments, 1));
                },
                "call": function(expr, args) {
                        return [ this[0], walk(expr), MAP(args, walk) ];
                },
                "function": _lambda,
                "defun": _lambda,
                "method": _lambda,
                "getter": _lambda,
                "setter": _lambda,
                "class": function(name, members, superclass) {
                        return [ this[0], name, MAP(members, walk), walk(superclass) ];
                },
                "interface": function(name, members) {
                        return [ this[0], name, MAP(members, walk) ];
                },
                "package": function(name, statements) {
                        return [ this[0], name, MAP(statements, walk) ];
                },
                "import": function(name) {
                        return [ this[0], name ];
                },
                "namespace": function(name, modifiers, tags) {
                        return [ this[0], name, modifiers ];
                },
                "property": function(defs, modifiers) {
                        defs = MAP(defs, function(def) {
                                return [ def[0], walk(def[1]), def[2] ];
                        });
                        return [ this[0], defs, modifiers.slice() ];
                },
                "if": function(conditional, t, e) {
                        return [ this[0], walk(conditional), walk(t), walk(e) ];
                },
                "for": function(init, cond, step, block) {
                        return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];
                },
                "for-in": function(vvar, key, hash, block) {
                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
                },
                "for-each": function(vvar, key, hash, block) {
                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
                },
                "while": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "do": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "return": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "binary": function(op, left, right) {
                        return [ this[0], op, walk(left), walk(right) ];
                },
                "unary-prefix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "unary-postfix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "sub": function(expr, subscript) {
                        return [ this[0], walk(expr), walk(subscript) ];
                },
                "object": function(props) {
                        return [ this[0], MAP(props, function(p){
                                return p.length == 2
                                        ? [ p[0], walk(p[1]) ]
                                        : [ p[0], walk(p[1]), p[2] ]; // get/set-ter
                        }) ];
                },
                "regexp": function(rx, mods) {
                        return [ this[0], rx, mods ];
                },
                "array": function(elements) {
                        return [ this[0], MAP(elements, walk) ];
                },
                "stat": function(stat) {
                        return [ this[0], walk(stat) ];
                },
                "seq": function() {
                        return [ this[0] ].concat(MAP(slice(arguments), walk));
                },
                "label": function(name, block) {
                        return [ this[0], name, walk(block) ];
                },
                "with": function(expr, block) {
                        return [ this[0], walk(expr), walk(block) ];
                },
                "atom": function(name) {
                        return [ this[0], name ];
                },
                "splat": function() {
                        return [ this[0] ];
                }
        };

        var user = {};
        var stack = [];
        function walk(ast) {
                if (ast == null)
                        return null;
                try {
                        stack.push(ast);
                        var type = ast[0];
                        var gen = user[type];
                        if (gen) {
                                var ret = gen.apply(ast, ast.slice(1));
                                if (ret != null)
                                        return ret;
                        }
                        gen = walkers[type];
                        if (!gen) {
                            throw new Error("Not supported: " + type + " of " + ast);
                        }
                        return gen.apply(ast, ast.slice(1));
                } finally {
                        stack.pop();
                }
        };

        function with_walkers(walkers, cont){
                var save = {}, i;
                for (i in walkers) if (HOP(walkers, i)) {
                        save[i] = user[i];
                        user[i] = walkers[i];
                }
                var ret = cont();
                for (i in save) if (HOP(save, i)) {
                        if (!save[i]) delete user[i];
                        else user[i] = save[i];
                }
                return ret;
        };

        return {
                walk: walk,
                with_walkers: with_walkers,
                parent: function() {
                        return stack[stack.length - 2]; // last one is current node
                },
                stack: function() {
                        return stack;
                }
        };
};

function copy_visit(visitor) {
    var visit = visitor.visit;

    function _vardefs(defs) {
        return [ this[0], MAP(defs, function(def){
            return [ def[0], visit(def[1]), def[2] ];
        }) ];
    }

    function _block(statements) {
        var out = [ this[0] ];
        if (statements) {
            out.push(MAP(statements, visit));
        }
        return out;
    }

    function _lambda(name, args, body, returnType, modifiers) {
        return [
            this[0],
            name,
            args.slice(),
            body ? MAP(body, visit) : null,
            returnType,
            modifiers ? modifiers.slice() : null
        ];
    }

    return {
        "string": function(str) {
            return [ this[0], str ];
        },
        "num": function(num) {
            return [ this[0], num ];
        },
        "name": function(name) {
            return [ this[0], name ];
        },
        "toplevel": function(statements) {
            return [ this[0], MAP(statements, visit) ];
        },
        "block": _block,
        "splice": _block,
        "var": _vardefs,
        "const": _vardefs,
        "astry": function(t, c, f) {
            return [
                this[0],
                MAP(t, visit),
                c == null ? null : MAP(c, function(cc) {
                    return [ cc[0], MAP(cc[1], visit) ];
                }),
                f == null ? null : MAP(f, visit)
            ];
        },
        "try": function(t, c, f) {
            return [
                this[0],
                MAP(t, visit),
                c != null ? [ c[0], MAP(c[1], visit) ] : null,
                f != null ? MAP(f, visit) : null
            ];
        },
        "throw": function(expr) {
            return [ this[0], visit(expr) ];
        },
        "new": function(ctor, args) {
            return [ this[0], visit(ctor), MAP(args, visit) ];
        },
        "switch": function(expr, body) {
            return [ this[0], visit(expr), MAP(body, function(branch) {
                return [
                    branch[0] ? visit(branch[0]) : null,
                    MAP(branch[1], visit)
                ];
            }) ];
        },
        "break": function(label) {
            return [ this[0], label ];
        },
        "continue": function(label) {
            return [ this[0], label ];
        },
        "conditional": function(cond, t, e) {
            return [ this[0], visit(cond), visit(t), visit(e) ];
        },
        "assign": function(op, lvalue, rvalue) {
            return [ this[0], op, visit(lvalue), visit(rvalue) ];
        },
        "dot": function(expr) {
            return [ this[0], visit(expr) ].concat(slice(arguments, 1));
        },
        "call": function(expr, args) {
            return [ this[0], visit(expr), MAP(args, visit) ];
        },
        "function": _lambda,
        "defun": _lambda,
        "method": _lambda,
        "getter": _lambda,
        "setter": _lambda,
        "class": function(name, members, superclass) {
            return [ this[0], name, MAP(members, visit), visit(superclass) ];
        },
        "interface": function(name, members) {
            return [ this[0], name, MAP(members, visit) ];
        },
        "package": function(name, statements) {
            return [ this[0], name, MAP(statements, visit) ];
        },
        "import": function(name) {
            return [ this[0], name ];
        },
        "namespace": function(name, modifiers, tags) {
            return [ this[0], name, modifiers ];
        },
        "property": function(defs, modifiers) {
            defs = MAP(defs, function(def) {
                return [ def[0], visit(def[1]), def[2] ];
            });
            return [ this[0], defs, modifiers.slice() ];
        },
        "if": function(conditional, t, e) {
            return [ this[0], visit(conditional), visit(t), visit(e) ];
        },
        "for": function(init, cond, step, block) {
            return [ this[0], visit(init), visit(cond), visit(step), visit(block) ];
        },
        "for-in": function(vvar, key, hash, block) {
            return [ this[0], visit(vvar), visit(key), visit(hash), visit(block) ];
        },
        "for-each": function(vvar, key, hash, block) {
            return [ this[0], visit(vvar), visit(key), visit(hash), visit(block) ];
        },
        "while": function(cond, block) {
            return [ this[0], visit(cond), visit(block) ];
        },
        "do": function(cond, block) {
            return [ this[0], visit(cond), visit(block) ];
        },
        "return": function(expr) {
            return [ this[0], visit(expr) ];
        },
        "binary": function(op, left, right) {
            return [ this[0], op, visit(left), visit(right) ];
        },
        "unary-prefix": function(op, expr) {
            return [ this[0], op, visit(expr) ];
        },
        "unary-postfix": function(op, expr) {
            return [ this[0], op, visit(expr) ];
        },
        "sub": function(expr, subscript) {
            return [ this[0], visit(expr), visit(subscript) ];
        },
        "object": function(props) {
            return [ this[0], MAP(props, function(p){
                return p.length == 2
                    ? [ p[0], visit(p[1]) ]
                    : [ p[0], visit(p[1]), p[2] ]; // get/set-ter
            }) ];
        },
        "regexp": function(rx, mods) {
            return [ this[0], rx, mods ];
        },
        "array": function(elements) {
            return [ this[0], MAP(elements, visit) ];
        },
        "stat": function(stat) {
            return [ this[0], visit(stat) ];
        },
        "seq": function() {
            return [ this[0] ].concat(MAP(slice(arguments), visit));
        },
        "label": function(name, block) {
            return [ this[0], name, visit(block) ];
        },
        "with": function(expr, block) {
            return [ this[0], visit(expr), visit(block) ];
        },
        "atom": function(name) {
            return [ this[0], name ];
        },
        "splat": function() {
            return [ this[0] ];
        }
    };
}

function ast_visitor(/* visitors... */) {
    function visit_with(node, visitors) {
        if (node === null || typeof node === 'undefined') {
            return null;
        }

        var type = String(node[0]);
        var i;
        for (i = 0; i < visitors.length; ++i) {
            var visitor = visitors[i];
            if (HOP(visitor, type)) {
                var newNode = visitor[type].apply(node, slice(node, 1));
                if (typeof newNode !== 'undefined') {
                    return newNode;
                }
            }
        }
        throw new Error("No visitor for node type: " + type);
    }

    var visitors = slice(arguments).map(function (visitor, i) {
        if (typeof visitor === 'function') {
            return visitor({
                visit: visit,
                next: function next(node) {
                    return visit_with(node, slice(visitors, i + 1));
                }
            });
        } else {
            return visitor;
        }
    });

    function visit(node) {
        return visit_with(node, visitors);
    }

    return {
        visit: visit
    };
}

function ast_visit(node /* visitors... */) {
    var visitors = slice(arguments, 1);
    return ast_visitor.apply(null, visitors).visit(node);
}

/* -----[ Scope and mangling ]----- */

function Scope(parent) {
        this.names = [];        // name objects defined in this scope
        this.parent = parent;   // parent scope
        this.name_refs = [];    // names referenced by this scope
        this.children = [];     // sub-scopes
        this.global = this;     // global namespace
        if (parent) {
                parent.children.push(this);
                this.global = parent.global;
        }
        this.is_global = this.global == this;
};

Scope.prototype = {
        lookup_here: function(name) {
                if (this.names.indexOf(name) >= 0)
                        return this;
        },
        lookup: function(name) {
                for (var s = this; s; s = s.parent) {
                        var n = s.lookup_here(name);
                        if (n) return n;
                }
        },
        can_rename: function(name, nameString) {
                if (!is_identifier(nameString)) return false;

                var stop = {};

                try {
                        // Ensure that the new name:

                        // 1. isn't the same as another name defined in this
                        //    scope
                        if (this.get_name_here(nameString)) return false;

                        var existingName = this.get_name(nameString);

                        this.walk(function(scope) {
                                // 2. doesn't shadow a mangled name from a
                                //    parent scope, unless we don't reference
                                //    the original name from this scope OR from
                                //    any sub-scopes!
                                scope.name_refs.forEach(function(nameRef) {
                                        if (nameRef.toString() == nameString) throw stop;
                                });

                                // 3. doesn't shadow an original name from a
                                //    parent scope, in the event that the name
                                //    is not mangled in the parent scope and we
                                //    reference that name here OR IN ANY
                                //    SUBSCOPES!
                                if (existingName && scope.get_name_here(nameString)) throw stop;
                        });
                } catch (e) {
                        if (e == stop) return false;
                        throw e;
                }

                return true;
        },
        get_name_here: function(nameString) {
                nameString = nameString.toString();

                for (var i = 0; i < this.names.length; ++i)
                        if (this.names[i].toString() == nameString)
                                return this.names[i];
        },
        get_name: function(nameString, createGlobal) {
                nameString = nameString.toString();

                for (var s = this; s; s = s.parent) {
                        var name = s.get_name_here(nameString);
                        if (name) return name;
                }

                if (createGlobal) {
                        var name = new Name(nameString);
                        name.is_implicit_global = true;
                        return this.global.define(name);
                }
        },
        reference: function(name) {
                if (!(name instanceof Name)) throw new Error(name);
                this.name_refs.push(name);
                name.ref_scopes.push(this);
                return name;
        },
        define: function(name) {
                this.names.push(name);
                name.def_scope = this;
                return name;
        },
        walk: function(callback) {
                callback(this);
                this.children.forEach(function(child) {
                        child.walk(callback);
                });
        },
        level: function() {
                var level = 0;
                for (var s = this; s; s = s.parent)
                        ++level;
                return level;
        },
        get_self_name: function() {
                for (var s = this; s; s = s.parent)
                        if (s.self_name) return s.self_name;
        }
};

function WithScope(parent) {
        Scope.call(this, parent);
};

WithScope.prototype = new Scope();

WithScope.prototype.get_name = function(nameString, createGlobal) {
        var name = this.get_name_here(nameString);
        if (name) return name;

        name = Scope.prototype.get_name.call(this, nameString, createGlobal);
        if (name) return this.define(name);
};

WithScope.prototype.define = function(name) {
        var existing = this.lookup_here(name);
        if (existing) return existing;

        var withName = new WithName(name.toString(), name);

        return Scope.prototype.define.call(this, withName);
};

function ClassScope(class_name, super_name, parent) {
        Scope.call(this, parent);

        this.class_name = class_name;
        this.super_name = super_name;
};

ClassScope.prototype = new Scope();

ClassScope.prototype.get_name_here = function(nameString) {
        var name = Scope.prototype.get_name_here.call(this, nameString);

        if (!name && this.get_super_scope()) {
                name = this.get_super_scope().get_name_here(nameString);
        }

        return name;
};

ClassScope.prototype.get_super_scope = function() {
        return this.super_name && this.super_name.class_scope;
};

Scope.prototype.get_class_scope = function() {
        for (var s = this; s; s = s.parent)
                if (s instanceof ClassScope) return s;
};

function Name(string) {
        this.string = string;           // string identifier representation in code
        this.is_implicit_global = false;// true if this name was referenced but not defiend
        this.ref_scopes = [];           // scopes referencing this name
        this.def_scope = null;          // scope this name was defiend in
        this.with_names = [];           // WithNames referencing this name
        this.export_path = null;        // path to access this name, if any
        this.needs_linkage = false;
};

Name.prototype.toString = function() {
        return String(this.string);
};

Name.prototype.rename = function(newString) {
        this.string = newString;
};

Name.prototype.referenced_by = function(scope) {
        return this.ref_scopes.indexOf(scope) >= 0;
};

Name.prototype.get_ast = function() {
        return [ "name", this ];
};

function get_name_ast(name) {
        if (name.get_ast) {
                return name.get_ast();
        }

        return [ "name", name ];
};

function ExportName(name) {
        var exportName;
        if (typeof name == "object")
                exportName = Object.create(name);
        else
                exportName = new Name(name);

        exportName.needs_import = true;
        return exportName;
};

function ImmutableName(string) {
        Name.call(this, string);

        this.is_immutable = true;
};

ImmutableName.prototype = new Name();

function WithName(string, name) {
        Name.call(this, string);

        this.without_name = name;
        name.with_names.push(this);
};

WithName.prototype = new Name();

WithName.prototype.toString = function() {
        return this.without_name.toString();
};

WithName.prototype.rename = function(newString) {
        this.without_name.rename(newString);
};

function ast_scope_annotate(ast, globals) {
        var w = ast_walker(), walk = w.walk;
        var current_scope = null;

        function with_scope(scope, cont) {
                var old_scope = current_scope;
                current_scope = scope;
                var ret = cont();
                current_scope = old_scope;
                return ret;
        };

        function annotate(ast, scope) {
                ast.scope = scope;
                return ast;
        };

        function define(nameString, type) {
                var name;
                if (typeof nameString == "string") {
                        name = new Name(nameString);
                } else {
                        name = nameString;
                }
                if (type && type != "*") {
                    if (type == 1) debugger;
                        reference(type);
                        name.type = type;
                }
                return current_scope.define(name);
        };

        function reference(nameString) {
                var name;
                if (typeof nameString == "string") {
                        name = current_scope.get_name(nameString, true);
                } else {
                        name = nameString;
                }
                return current_scope.reference(name);
        };

        function lambda(name, args, body, returnType, modifiers) {
                var is_defun = this[0] == "defun";
                var is_inner_named = this[0] == "function";
                var is_outer_named = this[0] != "function";
                var is_class_member = is_outer_named && !is_defun;
                var type = "Function";

                if (this[0] == "getter" || this[0] == "setter") {
                        type = null;
                }

                if (is_outer_named && name) {
                        define(name, type);
                }

                var scope = new Scope(current_scope);
                with_scope(scope, function(){
                        var scope = new Scope(current_scope);

                        if (is_inner_named && name) define(name, type);

                        with_scope(scope, function(){
                                if (is_class_member) {
                                        scope.self_name = scope.define(
                                                new Name(""),
                                                scope.get_class_scope().class_name
                                        );
                                }

                                scope.define(new ImmutableName("arguments", "Arguments"));
                                scope.define(new ImmutableName("this"));

                                MAP(args, function(arg) {
                                        define(arg[0], arg[1]);
                                        if (arg[2]) walk(arg[2]);
                                });
                                body = annotate(MAP(body, walk), scope);
                        });
                });

                return annotate([ this[0], name, args, body, returnType, modifiers ], scope);
        };

        function var_defs(defs) {
                MAP(defs, function(d){ define(d[0], d[2]); });
        };

        function with_block(expr, block) {
                expr = walk(expr);

                var scope = new WithScope(current_scope);
                with_scope(scope, function() {
                        block = walk(block);
                });

                return annotate([ this[0], expr, block ], scope);
        };

        function try_block(t, c, f) {
                return [
                        this[0],
                        MAP(t, walk),
                        MAP(c, function(cc){
                                return [ [ define(cc[0][0], cc[0][1]), cc[0][1] ], MAP(cc[1], walk) ];
                        }),
                        f != null ? MAP(f, walk) : null
                ];
        };

        function toplevel(statements) {
                var scope = new Scope(current_scope);
                with_scope(scope, function() {
                        MAP(globals || [ ], function(name) {
                                define(name);
                        });

                        statements = MAP(statements, walk);
                });

                return annotate([ this[0], statements ], scope);
        };

        function klass(name, members, superclass) {
                var defined = define(name);

                // Super awesome complex logic
                var super_name = superclass
                    ? superclass[1]
                    : globals
                        ? globals[globals.map(String).indexOf('Object')]
                        : null;

                var scope = new ClassScope(name, super_name, current_scope);
                with_scope(scope, function() {
                        if (super_name && super_name instanceof Name) {
                                reference(super_name);
                        }
                        defined.class_scope = scope;
                        members = MAP(members, walk);
                });

                return annotate([ this[0], name, members, walk(superclass) ], scope);
        };

        function scoped(callback) {
                return function() {
                        var scope = this.scope;
                        var args = arguments;
                        var self = this;

                        return with_scope(scope, function() {
                                return annotate(callback.apply(self, args), scope);
                        });
                };
        };

        function scoped_lambda() {
                return scoped(function(name, args, body, returnType, members) {
                        body = annotate(MAP(body, walk), body.scope);
                        args = MAP(args, function(arg) {
                                return [ arg[0], arg[1], arg[2] ? walk(arg[2]) : null ];
                        });
                        return [ this[0], name, args.slice(), body, returnType, members ];
                }).apply(this, arguments);
        };

        // Scope annotation comes in two passes.  The first pass collects
        // definitions (vars, arguments, this, etc.) per-scope.  The second pass
        // notes references to those definitions in each scope.  The passes
        // can't easily be merged because sometimes definitions occur *after* a
        // name is referenced.  Take the following example:
        //
        // foo();
        // function foo() { alert('hi'); }
        //
        // The call to foo must reference the same name as the definition of foo
        // (which occurs later).  Having two passes solves the problem easily.
        ast = w.with_walkers({
                "function": lambda,
                "defun": lambda,
                "method": lambda,
                "getter": lambda,
                "setter": lambda,
                "var": var_defs,
                "const": var_defs,
                "property": function(defs, modifiers) {
                        MAP(defs, function(def) {
                                define(def[0], def[2]);
                        });
                },
                "astry": try_block,
                "with": with_block,
                "class": klass,
                "interface": function() {
                        // Don't traverse
                        return this;
                },
                "toplevel": toplevel
        }, function() {
                return walk(ast);
        });

        ast = w.with_walkers({
                "toplevel": scoped(function(statements) {
                        return [ this[0], MAP(statements, walk) ];
                }),
                "class": scoped(function(name, members, superclass) {
                        return [ this[0], name, MAP(members, walk), walk(superclass) ];
                }),
                "interface": function() {
                        // Don't traverse
                        return this;
                },
                "function": scoped_lambda,
                "defun": scoped_lambda,
                "method": scoped_lambda,
                "getter": scoped_lambda,
                "setter": scoped_lambda,
                "astry": function(t, c, f) {
                        MAP(c, function(cc){
                                reference(cc[0][0]);
                        });
                },
                "with": scoped(function(expr, block) {
                        return [ this[0], walk(expr), walk(block) ];
                }),
                "name": function(name) {
                        reference(name);
                }
        }, function() {
                return walk(ast);
        });

        return ast;
};

function ast_make_names(ast, globals) {
        if (!ast.scope) ast = ast_scope_annotate(ast, globals);

        var current_scope = null;
        var w = ast_walker(), walk = w.walk;

        function with_scope(scope, cont) {
                var old_scope = current_scope;
                current_scope = scope;
                var ret = cont();
                current_scope = old_scope;
                return ret;
        };

        function lambda(name, args, body, returnType, modifiers) {
                var is_defun = this[0] == "defun";
                var defined_name = null;
                if (is_defun && name) defined_name = current_scope.get_name(name);

                with_scope(this.scope, function() {
                        if (!is_defun && name) defined_name = current_scope.get_name(name);

                        if (defined_name && modifiers && modifiers.indexOf("static") >= 0) {
                                defined_name.is_static = true;
                        }

                        with_scope(body.scope, function() {
                                args = MAP(args, function(arg) {
                                        return [
                                                current_scope.get_name(arg[0]),
                                                arg[1], // TODO rewrite
                                                arg[2] ? walk(arg[2]) : null
                                        ];
                                });
                                body = MAP(body, walk);

                                returnType = returnType; // TODO rewrite
                        });
                });

                return [ this[0], defined_name, args, body, returnType, slice(modifiers) ];
        };

        function var_defs(defs) {
                defs = MAP(defs, function(d) {
                        return [ current_scope.get_name(d[0]), walk(d[1]), d[2] ? current_scope.get_name(d[2]) : null ];
                });

                return [ this[0], defs ];
        };

        function try_block(t, c, f) {
                t = MAP(t, walk);
                c = MAP(c, function(cc){
                        return [ [ current_scope.get_name(cc[0][0]), cc[0][1] ], MAP(cc[1], walk) ];
                });
                if (f != null) f = MAP(f, walk);

                return [ this[0], t, c, f ];
        };

        function property(defs, modifiers) {
                var is_static = modifiers && modifiers.indexOf("static") >= 0;

                defs = MAP(defs, function(def) {
                        var name = current_scope.get_name(def[0]);
                        name.is_static = is_static;
                        return [ name, walk(def[1]), def[2] ];
                });

                return [ this[0], defs, modifiers.slice() ];
        };

        function klass(name, members, superclass) {
                superclass = walk(superclass);

                var has_superclass = superclass && superclass[0] == "name" && superclass[1];
                if (has_superclass) {
                        this.scope.super_name = superclass[1];
                }

                with_scope(this.scope, function() {
                        name = current_scope.get_name(name);
                        if (has_superclass) {
                                superclass = [ superclass[0], current_scope.get_name(superclass[1]) ];
                        }
                        members = MAP(members, walk);
                });

                return [ this[0], name, members, superclass ];
        };

        function name(name) {
                var fuck = true; // Yeah.
                return [ this[0], current_scope.get_name(name, fuck) ];
        };

        function call(expr, args) {
                // Define args first, then walk the body
                args = MAP(args, walk);
                expr = walk(expr);
                return [ this[0], expr, args ];
        };

        return w.with_walkers({
                "function": lambda,
                "defun": lambda,
                "method": lambda,
                "getter": lambda,
                "setter": lambda,
                "var": var_defs,
                "const": var_defs,
                "property": property,
                "astry": try_block,
                "with": function(expr, block) {
                        var w = this;
                        return with_scope(this.scope, function() {
                                return [ w[0], walk(expr), walk(block) ];
                        });
                },
                "toplevel": function(statements) {
                        var toplevel = this;
                        return with_scope(this.scope, function() {
                                return [ toplevel[0], MAP(statements, walk) ];
                        });
                },
                "class": klass,
                "interface": function() {
                        // Don't traverse
                        return this;
                },
                "name": name,
                "call": call
        }, function() {
                return walk(ast);
        });
};

/* -----[ rewrite AS3 as JS ]----- */

var base54 = (function(){
        var DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_";
        return function(num) {
                var ret = "";
                do {
                        ret = DIGITS.charAt(num % 54) + ret;
                        num = Math.floor(num / 54);
                } while (num > 0);
                return ret;
        };
})();

function get_imports(ast) {
        var imports = [ ];

        var w = ast_walker(), walk = w.walk;

        w.with_walkers({
                "import": function(import_name) {
                        imports.push(import_name);
                }
        }, function() {
                return walk(ast);
        });

        return imports;
};

function rewrite_fqn(fqn /* ... */) {
        return MAP(arguments, function(fqn){
                return fqn.replace(/\./g, "/");
        }).filter(function(x){
                return !!x;
        }).join("/");
};

function rewrite(ast, name_table) {
    function make_define(export_name, import_names, statements) {
        var import_strings = [ "array", MAP(import_names, function(name) {
            return [ "string", name.export_path || "UNRESOLVED" ];
        }) ];

        var import_arguments = MAP(import_names, function(name) {
            return [ name, null ];
        });

        var args = [ ];
        if (export_name) {
            args.push([ "string", export_name ]);
        }
        args.push(import_strings);
        args.push([ "function", "", import_arguments, statements ]);

        return [ "call", [ "name", "define" ], args ];
    }

    var w = ast_walker(), walk = w.walk, scope;

    // Find class names
    var current_package_name = null;
    var exported_class_name = null;
    var exported_class_package_name = null;
    var internal_classes = [ ];
    var defined_classes = [ ];
    ast_visit(ast, function (visitor) {
        return {
            "package": function(name, statements) {
                current_package_name = name;
                visitor.next(this);
                current_package_name = null;
                return this;
            },
            "class": function(name) {
                if (current_package_name != null) {
                    if (exported_class_name) {
                        // Only set the class name if it's the first in a package
                        throw new Error("Multiple classes per package not supported");
                    }
                    exported_class_package_name = current_package_name;
                    exported_class_name = name;
                } else {
                    internal_classes.push(name);
                }
                defined_classes.push(String(name));
            }
        };
    }, copy_visit);

    // Figure out what names in the same namespace are referenced but not
    // explicitly imported
    // TODO Refactor
    var extra_imports = [ ];
    if (name_table) {
        var namespace_names = [ ];

        function include_package(package_name) {
            var names = [ ];
            MAP(name_table.get_names_in_namespace(package_name), function (name) {
                // If this module defines a referenced name,
                // don't import it
                var name_string = String(name);
                if (defined_classes.indexOf(name_string) >= 0) {
                    return;
                }

                names.push(name);
            });

            namespace_names = namespace_names.concat(names);
        }

        if (exported_class_package_name) {
            include_package(exported_class_package_name);
        }

        // Include names from the default package too
        include_package('');

        var ast2 = ast_scope_annotate(ast_make_names(ast, namespace_names));

        // FIXME Ugly as sin; should clean this up
        var referenced_names = unique(namespace_names).filter(function (name) {
            return name.ref_scopes.some(function(scope) {
                return scope.global && scope.global == ast2.scope;
            });
        });

        extra_imports = extra_imports.concat(referenced_names);

        // For some fucking reason, we get
        // [ "dot", [ "dot", [ "name", "a" ], "b" ], "c" ]
        // for a.b.c sometimes.
        // This pass normalizes things.
        ast = ast_visit(ast, function (visitor) {
            return {
                "dot": function(expr) {
                    var rest = slice(arguments, 1);
                    if (expr[0] == "dot") {
                        var newNode = [ this[0], expr[1] ].concat(slice(expr, 2)).concat(rest);
                        return visitor.visit(newNode);
                    }
                }
            };
        }, copy_visit);

        ast = ast_visit(ast, function (visitor) {
            return {
                "dot": function(expr) {
                    // Check for fully-qualified names
                    // TODO Only do this checking on implicit globals
                    if (expr[0] == "name") {
                        var path = [ expr[1] ].concat(slice(arguments, 1));
                        var pair = name_table.get_name_from_maybe_fqn(path);
                        if (pair) {
                            var name = pair[0];
                            var rest = pair[1];

                            // HACK
                            var nameString = String(name);
                            if (defined_classes.indexOf(nameString) < 0 && extra_imports.map(String).indexOf(nameString) < 0) {
                                // Not defined in this module; import
                                extra_imports.push(name);
                            }

                            return [ "dot", [ "name", name ] ].concat(rest);
                        }
                    }
                }
            };
        }, copy_visit);
    }

    var globals = name_table ? name_table.get_names_in_namespace('').filter(function (name) {
        return !name.needs_import;
    }) : [ ];

    if (exported_class_name) {
        var import_strings = get_imports(ast);
        var import_names = extra_imports.slice();
        import_strings.forEach(function(import_string) {
            if (!name_table) {
                throw new Error("imports not supported");
            }

            var names;
            try {
                names = name_table.get_names(import_string);
            } catch (e) {
                // Warn on namespace failures
                warn(e.message);
                return;
            }

            names.forEach(function(name) {
                if (import_names.map(String).indexOf(name) < 0) {
                    import_names.push(name);
                }
                globals.push(name);
            });
        });

        import_names = import_names.filter(function (name) {
            return name.needs_import;
        });

        ast = ast_visit(ast, {
            "toplevel": function(statements) {
                statements = statements.concat([ [ "return", [ "name", exported_class_name ] ] ]);
                return [ "toplevel", [ make_define(null, import_names, statements) ] ];
            }
        });
    } else if (name_table) {
        warn("No export name detected");
    }


        ast = ast_scope_annotate(ast_make_names(ast, globals));

        var member_name_manglers = {
                "public": function(name) {
                        return name;
                },
                "protected": function(name) {
                        return name;
                },
                "private": function(name) {
                        // TODO Private name rewriting (e.g. _ prefix)
                        return name;
                }
        };

        function mangle_member_name(name, modifiers) {
                return modifiers.reduce(function (name, modifier) {
                        if (HOP(member_name_manglers, modifier)) {
                                return member_name_manglers[modifier](name);
                        }

                        return name;
                }, name);
        };

        function rewrite_name(scope, name, suggestion) {
                if (!suggestion) {
                        suggestion = name.toString();
                }

                var counter = -1;
                var ext = '';

                while (!scope.can_rename(name, suggestion + ext)) {
                        ext = base54(++counter);
                }

                name.rename(suggestion + ext);
        };

        function should_rewrite(name, ignoreKeywords) {
                if (!ignoreKeywords) {
                        if (name == "sp" || name == "self") return true;
                }
                //if (scope.modifiers) return true;
                return false;
        };

        function rewrite(name, ignoreKeywords) {
                if (!should_rewrite(name, ignoreKeywords)) return;

                if (!ignoreKeywords) {
                        if (name == "sp" || name == "self") rewrite_name(scope, name);
                } else if (scope.modifiers) {
                        rewrite_name(scope, name, mangle_member_name(name.toString(), scope.modifiers));
                }

                return name;
        };

        function get_rewritten(name, canRewrite, ignoreKeywords) {
                if (!canRewrite) return name;

                if (should_rewrite(name, ignoreKeywords)) {
                        return rewrite(name, ignoreKeywords);
                }

                return name;
        };

        function is_name_referenced(name, ast, shallow) {
            var is_referenced = { };
            var stop_descending = [ ];

            function maybe_new_scope() {
                if (shallow) {
                    return stop_descending;
                }
            }

            try {
                ast_visit(ast, function (visitor) {
                    return {
                        "name": function(curName) {
                            if (String(curName) == String(name)) {
                                throw is_referenced;
                            }
                        },
                        "function": maybe_new_scope,
                        "defun": maybe_new_scope,
                        "method": maybe_new_scope,
                        "class": maybe_new_scope
                    };
                }, copy_visit);
            } catch (e) {
                if (e == is_referenced) {
                    return true;
                }
                throw e;
            }
            return false;
        }

        function with_scope(s, cont) {
                var _scope = scope;
                scope = s;
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

        function _lambda(name, args, body, returnType, modifiers) {
                var is_defun = this[0] == "defun";
                var is_method = this[0] == "method";
                if (is_defun && name) name = get_rewritten(name, true, is_method);

                body = with_scope(body.scope, function(){
                        scope.modifiers = modifiers;
                        if (!is_defun && name) name = get_rewritten(name, true, is_method);
                        return MAP(body, walk);
                });

                return [ this[0], name, args, body, returnType, modifiers ];
        };

        function method(name, args, body, returnType, modifiers) {
                // We make a new inner name instead of reusing the
                // outer (class member) name so we can rewrite
                // getter and setter names later.
                var inner_name = new Name(name.toString());

                var lambda = _lambda.call(this, inner_name, args, body, returnType, modifiers);
                body = lambda[3];

                var self_name = body.scope.self_name;

                if (self_name.ref_scopes.length) {
                        var body_scope = body.scope;

                        // Self is referenced; include declaration
                        body = [ [ "var", [
                                [ self_name, [ "name", body.scope.get_name_here("this") ] ]
                        ] ] ].concat(body);

                        rewrite_name(body_scope, self_name, "self");
                }

                return [ "function", lambda[1], lambda[2], body ];
        };

        function get_sp_node() {
                // TODO explicitly make a global name and reuse
                return [ "name", "sp" ];
        };

        function get_this_node() {
                var self_name = scope.get_self_name();
                return [ "name", self_name ];
        };

        function sp_ref(/* ... */) {
                return [ "dot", get_sp_node() ].concat(slice(arguments));
        };

        function getter_setter_member(name, getter, setter) {
                var getset = [ ];

                if (getter) getset.push([ "get", getter ]);
                if (setter) getset.push([ "set", setter ]);

                return [ name, [ "object", getset ] ];
        };

        function method_member(method) {
                return [ method[1], method ];
        };

        function add_constructor_calls(name, constructor, constructorCalls) {
                if (constructor == null && constructorCalls.length) {
                        // To assign properties, we need a constructor
                        constructor = [ "function", name, [ ], [ ] ];
                }

                if (constructor == null) {
                        return null;
                } else {
                        constructor[3] = constructorCalls.concat(constructor[3]);
                        return constructor;
                }
        }

        function rewrite_super_calls(ast, callback) {
                var w = ast_walker();

                return w.with_walkers({
                        "call": function(expr, args) {
                                if (expr[0] == "name" && expr[1] == "super") {
                                        return callback.apply(this, arguments);
                                }
                        }
                }, function() {
                        return w.walk(ast);
                });
        }

        function rewrite_super_references(ast, callback) {
                var w = ast_walker();

                return w.with_walkers({
                        "name": function(name) {
                                if (name == "super") {
                                        return callback();
                                }
                        }
                }, function() {
                        return w.walk(ast);
                });
        }

        function klass(name, members, superclass) {
                var classCreateNode = [ "dot", [ "name", "sp" ], "Class", "create" ];

                var linkage = null;
                if(name_table) {
                        var fqn = exported_class_package_name + "::" + name;
                        var art_name = name_table.get_name_from_fqn(fqn);
                        if(art_name && art_name.needs_linkage) {
                                linkage = fqn;
                        }
                }

                var bodyChildrenNodes = [ ];

                var constructor = null;

                var methods = [ ];
                var properties = [ ];

                var instance_getters = { };
                var instance_setters = { };
                var instance_getters_setters = { };

                var static_getters = { };
                var static_setters = { };
                var static_getters_setters = { };

                function is_property_static(property) {
                        return property[4].indexOf("static") >= 0;
                };

                function is_method_static(method) {
                        return method[5].indexOf("static") >= 0;
                };

                // Sort the class members by type
                members.forEach(function(member) {
                        var memberName;
                        var is_static;

                        switch (member[0]) {
                            case "method":
                                if (member[1] == name) {
                                        constructor = member;
                                } else {
                                        methods.push(member);
                                }

                                break;

                            case "property":
                                member = walk(member);
                                member[1].forEach(function(def) {
                                        properties.push([ "prop", def[0], def[1], def[2], member[2] ]);
                                });

                                break;

                            case "getter":
                                is_static = is_method_static(member);

                                member = walk(member);
                                memberName = member[1].toString();

                                if (is_static) {
                                        static_getters_setters[memberName] = true;
                                        static_getters[memberName] = member;
                                } else {
                                        instance_getters_setters[memberName] = true;
                                        instance_getters[memberName] = member;
                                }

                                member[1].rename("get_" + memberName);

                                break;

                            case "setter":
                                is_static = is_method_static(member);

                                member = walk(member);
                                memberName = member[1].toString();

                                if (is_static) {
                                        static_getters_setters[memberName] = true;
                                        static_setters[memberName] = member;
                                } else {
                                        instance_getters_setters[memberName] = true;
                                        instance_setters[memberName] = member;
                                }

                                member[1].rename("set_" + memberName);

                                break;
                        }
                });

                function superof(node) {
                        return [ "call", [ "dot", get_sp_node(), "superOf" ], [ node ] ];
                }

                var super_name = superclass ? walk(superclass) : [ "name", "Object" ];
                function super_ctor(expr, args) {
                        if (SUPER_OF_CTOR) {
                                return [ this[0],
                                       [ "dot", superof([ "name", "this" ]), "constructor" ],
                                       args
                                ];
                        } else {
                                return [ this[0],
                                        [ "dot", super_name, "call" ],
                                        [ [ "name", "this" ] ].concat(args)
                                ];
                        }
                }

                function super_method_fn(method_name) {
                        return function(expr, args) {
                                return [ this[0],
                                        [ "dot", superof([ "name", "this" ]), method_name ],
                                        args
                                ];
                        };
                }

                function rewrite_all_super(ast, callback) {
                        ast = rewrite_super_calls(ast, callback);
                        ast = rewrite_super_references(ast, function() {
                                return superof([ "name", "this" ]);
                        });
                        return ast;
                }

                // Constructor
                var instance_properties = properties.filter(function(property) {
                        return !is_property_static(property);
                });

                var instance_properties_with_value = instance_properties.filter(function(prop) {
                        var value = prop[2];
                        return value && !is_constant(value);
                });

                var constructorCalls = instance_properties_with_value.map(function(prop) {
                        // FIXME "self" is not used, causing
                        // inconsistent code.

                        var name = prop[1];
                        var value = prop[2];

                        return [ "stat", [ "assign",
                                "",
                                [ "dot", [ "name", "this" ], name ],
                                value
                        ] ];
                });

                if (superclass && constructor && !is_name_referenced("super", constructor, false)) {
                        // Force super to be called
                        if (SUPER_OF_CTOR) {
                                constructorCalls.unshift([ "stat", [ "call",
                                        [ "dot", superof([ "name", "this" ]), "constructorArgs" ],
                                        [ [ "name", "arguments" ] ]
                                ] ]);
                        } else {
                                constructorCalls.unshift([ "stat", [ "call",
                                        [ "dot", super_name, "apply" ],
                                        [ [ "name", "this" ], [ "name", "arguments" ] ]
                                ] ]);
                        }
                }

                var constructorFn = rewrite_all_super(walk(constructor), super_ctor);
                constructorFn = add_constructor_calls(name, constructorFn, constructorCalls);

                if (constructorFn) {
                    // If the ctor references a static
                    // member using the function name, bad
                    // things happen.  This fixes it (scope
                    // dodging).
                    var refd = is_name_referenced(constructorFn[1], constructorFn, false)
                        || is_name_referenced(name, constructorFn, false);
                    if (refd) {
                        // FIXME Should be new name code we already wrote
                        constructorFn[1] += "_";
                    }
                }

                if (linkage) {
                    bodyChildrenNodes.push([ "linkage", [ "string", linkage ] ]);
                }

                if (constructorFn) bodyChildrenNodes.push([ "constructor", constructorFn ]);

                // Instance properties
                var instance_property_pairs = instance_properties.map(function (property) {
                        if (property[2] && is_constant(property[2]))
                                return [ property[1], property[2] ];

                        return [ property[1], [ "name", "null" ] ];
                });
                if (instance_property_pairs.length > 0) {
                        bodyChildrenNodes.push([ "properties", [ "object", instance_property_pairs ] ]);
                }

                // Instance methods
                var instance_methods = methods.filter(function(method) {
                        return !is_method_static(method);
                }).map(function(method) {
                        return rewrite_all_super(walk(method), super_method_fn(method[1]));
                });

                var instance_method_pairs = instance_methods.map(method_member);
                if (instance_method_pairs.length > 0) {
                        bodyChildrenNodes.push([ "prebound", [ "object", instance_method_pairs ] ]);
                }

                var instance_getter_setter_pairs = Object.keys(instance_getters_setters)
                        .map(getter_setter(instance_getters, instance_setters, function(method) {
                                return rewrite_all_super(method, super_method_fn(method[1]));
                        }));
                if (instance_getter_setter_pairs.length > 0) {
                        bodyChildrenNodes.push([ "methods", [ "object", instance_getter_setter_pairs ] ]);
                }

                function getter_setter(getters, setters, callback) {
                        callback = callback || function(x) { return x; };

                        return function (getterSetterName) {
                                var getter, setter;

                                if (HOP(getters, getterSetterName))
                                        getter = callback(getters[getterSetterName]);

                                if (HOP(setters, getterSetterName))
                                        setter = callback(setters[getterSetterName]);

                                return getter_setter_member(getterSetterName, getter, setter);
                        };
                };

                // Statics
                var static_methods = methods.filter(is_method_static).map(walk);
                var static_method_pairs = static_methods.map(method_member);

                var static_properties = properties.filter(is_property_static);
                var static_getter_setter_pairs = Object.keys(static_getters_setters).map(getter_setter(static_getters, static_setters));
                var static_property_pairs = static_properties.map(function(property) {
                        if (property[2]) {
                            return [ property[1], property[2] ];
                        } else {
                            return [ property[1], [ "name", "null" ] ];
                        }
                });

                var static_pairs = static_property_pairs
                    .concat(static_method_pairs)
                    .concat(static_getter_setter_pairs);

                if (static_pairs.length > 0) {
                        bodyChildrenNodes.push([ "statics", [ "object", static_pairs ] ]);
                }

                // Class.create
                var bodyNode = [ "object", bodyChildrenNodes ];
                var args = [ ];

                if (name) args.push([ "string", name ]);
                if (superclass) args.push(walk(superclass));
                args.push(bodyNode);

                var madeClassNode = [ "call", classCreateNode, args ];

                return [ "var", [ [ name, madeClassNode, "Class" ] ] ];
        };

        // Delete stuff
        ast = ast_visit(ast, function (visitor) {
            var remove = { $: 'Should have been removed!!!' };

            function mapIf(array, fn) {
                return array.map(fn).filter(function (x) {
                    return x !== remove;
                });
            }

            function visitStatements(statements) {
                var newStatements = [ ];
                statements.forEach(function (node) {
                    var s = [ node ];
                    if (node[0] == "package") {
                        s = node[2];
                    }
                    newStatements.push.apply(newStatements, mapIf(s, visitor.visit));
                });
                return newStatements;
            }

            function lambda(name, args, body, returnType, modifiers) {
                return [ this[0], name, args.slice(), visitStatements(body), returnType, modifiers ];
            }

            return {
                "function": lambda,
                "defun": lambda,
                "method": lambda,
                "getter": lambda,
                "setter": lambda,

                "toplevel": function(statements) {
                    return [ this[0], visitStatements(statements) ];
                },

                "import": function(name) {
                    return remove;
                },
                "namespace": function(name, modifiers, tags) {
                    return remove;
                },
                "interface": function(name) {
                    warn("Interfaces are not supported; interface " + name + " ignored");
                    return remove;
                }
            };
        }, copy_visit);

        ast = ast_scope_annotate(ast, globals);

        function scoped_visit(visitor) {
            function scope_lambda(name, args, body, returnType, modifiers) {
                var self = this;
                return with_scope(body.scope, function() {
                    return visitor.next(self);
                });
            }

            return {
                "toplevel": function(body) {
                    var self = this;
                    return with_scope(self.scope, function() {
                        return visitor.next(self);
                    });
                },
                "method": scope_lambda,
                "function": scope_lambda,
                "defun": scope_lambda,
            };
        }

        // Arguments
        ast = ast_visit(ast, scoped_visit, function (visitor) {
            function get_slice_node(target, start, count) {
                // [ ].slice.call
                var arraySliceCallNode = [ "dot", [ "array", [] ], "slice", "call" ];

                // (arguments, args ...)
                var sliceArgumentsNodes = [ [ "name", "arguments" ] ];

                if (start || count) {
                    sliceArgumentsNodes.push(start || [ "num", 0 ]);

                    if (count) {
                        sliceArgumentsNodes.push(count);
                    }
                }

                return [ "call", arraySliceCallNode, sliceArgumentsNodes ];
            }

            function rewrite_argument_definitions(args) {
                var hiddenArgs = [ ];
                var newArgNames = [ ];
                var statements = [ ];

                args.forEach(function (arg, index){
                    var argName = get_rewritten(arg[0], true);
                    var argType = arg[1];
                    var argValue = arg[2];

                    newArgNames.push(argName);

                    if (argValue == null) {
                        // Plain ol' argument
                        return;
                    }

                    var isSplat = argValue[0] == "splat";

                    if (isSplat) {
                        // Splat argument
                        // TODO Handle not-in-last-slot

                        var splatValueNode = get_slice_node([ "name", "arguments" ], [ "num", index ]);

                        // var argName = splatValueNode
                        statement = [ "var", [ [ argName, splatValueNode ] ] ];

                        hiddenArgs[index] = true;

                        statements.unshift(statement);
                    } else {
                        // Optional argument
                        // TODO Check for non-constant expressions

                        // arguments.length
                        var argumentsLengthNode = [ "dot", [ "name", "arguments" ], "length" ];

                        // argumentsLength < index + 1
                        var argumentOmittedNode = [ "binary", "<", argumentsLengthNode, [ "num", index + 1 ] ]

                        // argName = argValue
                        var setDefaultValueNode = [ "assign", "", [ "name", argName ], argValue ];

                        // if (argumentOmitted) setDefaultValue;
                        statements.unshift([ "stat",
                            [ "if", argumentOmittedNode, setDefaultValueNode, null ]
                        ]);
                    }
                });

                // Strip hidden args if and only if they
                // are at the end of the argument list
                for (var i = newArgNames.length; i --> 0; ) {
                    if (hiddenArgs[i]) {
                        newArgNames = newArgNames.slice(0, i);
                    } else {
                        break;
                    }
                }

                return {
                    names: newArgNames,
                    statements: statements
                };
            }

            function lambda(name, args, body, returnType, modifiers) {
                // Rewrite arguments to be an array, if
                // used. This must be before rewriting
                // arguments because a rewritten argument
                // may reference arguments, and we shouldn't
                // need to rewrite those. (We may in the
                // future as a size optimization, but let's
                // keep things as simple as possible for
                // now...)
                var argumentsUsed = body.some(function (statement) {
                    return is_name_referenced("arguments", statement, true);
                });

                // Rewrite argument definitions
                // (optional and splat)
                var t = rewrite_argument_definitions(args);
                args = t.names.map(function (name) {
                    return [ name ];
                });
                body = t.statements.concat(body);

                body = MAP(body, visitor.visit);

                // This must be after rewriting body because
                // the "arguments" declared here would be
                // rewritten (and we don't want that).
                if (argumentsUsed) {
                    var argumentsArrayName = scope.get_name_here("arguments");

                    body.unshift([ "stat", [ "assign", "",
                        // Note: no typing information
                        [ "name", argumentsArrayName ], [ "call",
                            sp_ref("args"),
                            [ [ "name", argumentsArrayName ] ]
                        ]
                    ] ]);
                }

                return [ this[0], name, args, body, returnType, modifiers ];
            }

            return {
                "defun": lambda,
                "function": lambda,
                "method": lambda
            };
        }, copy_visit);

        ast = ast_scope_annotate(ast, globals);

        // General AS syntatic sugar
        ast = ast_visit(ast, scoped_visit, function (visitor) {
            var walk = visitor.visit;
            return {
                "for-each": function(vvar, key, hash, block) {
                    // for-each loops

                    // TODO Store the hash somewhere so we don't
                    // evaluate it once (or more) per iteration.

                    var new_key_name = new Name("");
                    scope.define(new_key_name);
                    rewrite_name(scope, new_key_name, "key");

                    var new_key = [ "name", new_key_name ];

                    // if (!{}.hasOwnProperty.call(hash, new_key)) continue;
                    var hop_check = walk([ "if",
                        [ "unary-prefix", "!", [ "call",
                            [ "dot", [ "object", [ ] ], "hasOwnProperty", "call" ],
                            [ hash, new_key ]
                        ] ],
                        [ "continue" ],
                        null
                    ]);

                    var assign;
                    var value = walk([ "sub", hash, new_key ]);

                    if (vvar[0] == "name") {
                        // User wrote for each(x ..); write x = in the
                        // body.
                        assign = [ "stat",
                            [ "assign", "", key, value ]
                        ];
                    } else {
                        // User wrote for each(var x ..) or for
                        // each(const x ..); write var x = or const x =
                        // in the body.
                        //
                        // TODO investigate for each(var x, y, z ..)
                        assign = [ vvar[0], [ [ vvar[1][0][0], value, null ] ] ];
                    }

                    var body = walk(block);

                    if (body[0] == "block") body = body[1];
                    else body = [ body ];

                    return [ "for-in",
                        [ "var", [ [ new_key_name ] ] ],
                        new_key,
                        walk(hash),
                        [ "block", [ hop_check, assign ].concat(body) ]
                    ];
                },
                "astry": function(t, c, f) {
                    // Typed try-catch

                    // TODO What happens with the following in AS3?
                    //
                    // try {
                    //     throw new Error();
                    // } catch (e:Error) {
                    //     throw new TypeError();
                    // } catch (e:TypeError) {
                    //     console.log("hi");
                    // }
                    if (c.length != 0) {
                        var catch_name = c[0][0][0];
                        MAP(c, function(cc) {
                            if (cc[0][0] != catch_name) throw new Error("Catch statements with different names not supported");
                        });

                        var ifs = [ ];
                        var el = null;
                        MAP(c, function(cc) {
                            if (cc[0][1] == "*" || cc[0][1] == null) {
                                if (el) throw new Error("Catch statements cannot overlap");
                                el = MAP(cc[1], walk);
                            } else {
                                // if (e instanceof Error) { ... }
                                ifs.push([ "if",
                                    [ "binary", "instanceof", [ "name", catch_name ], [ "name", cc[0][1] ] ],
                                    [ "block", MAP(cc[1], walk) ],
                                    null
                                ]);
                            }
                        });

                        if (!el) {
                            // throw e;
                            el = [ [ "block", [ [ "throw", [ "name", catch_name ] ] ] ] ];
                        }

                        var bodyNode = null;
                        var curNode = null;
                        MAP(ifs.concat(el), function(if_) {
                            if (curNode) curNode[3] = if_;
                            else bodyNode = if_;

                            curNode = if_;
                        });

                        c = [ catch_name, bodyNode ? [ bodyNode ] : [ ] ];
                    } else {
                        c = null;
                    }

                    return [
                        "try",
                        MAP(t, walk),
                        c,
                        f != null ? MAP(f, walk) : null
                    ];
                },
                "binary": function(operator, lvalue, rvalue) {
                    // foo is bar
                    // => sp.is(foo, bar)
                    if (operator == "is") {
                        return [ "call", sp_ref("is"), [ walk(lvalue), walk(rvalue) ] ];
                    }

                    // foo as bar
                    // => sp.as(foo, bar)
                    if (operator == "as") {
                        return [ "call", sp_ref("as"), [ walk(lvalue), walk(rvalue) ] ];
                    }
                },
                "assign": function(op, lvalue, rvalue) {
                    // &&=, ||=
                    if (op == "&&" || op == "||") {
                        // XXX Not fool proof:
                        //   foo().bar &&= baz;
                        //   foo().bar = foo().bar && baz; // foo() executed twice, .bar executed twice
                        lvalue = walk(lvalue);
                        rvalue = walk(rvalue);
                        return [ this[0], "", lvalue, [ "binary", op, lvalue, rvalue ] ];
                    }
                }
            };
        }, copy_visit);

        // Insert defaults for some built-ins (instead of undefined).
        //
        //   var x:int; => 0
        //   var x:int = null; => 0
        //   var x:uint; => 0
        //   var x:uint = null; => 0
        //   var x:Number; => NaN
        //   var x:Number = null; => 0
        //   var x:Boolean; => false
        //   var x:Boolean = null; => false
        //   var x:String; => null
        //   var x:String = null; => null
        //
        // For the cases with explicit value, we wrap the objects in the constructor.
        // Otherwise, we just insert the default value.
        var convertors = {
            "int": function convert_int(value) {
                if (value) {
                    return when_constant(value, function (_, num) {
                        return num === num >> 0 ? value : null;
                    }) || [ "call", sp_ref("toInt"), [ value ] ];
                } else {
                    return [ "num", 0 ];
                }
            },
            "uint": function convert_uint(value) {
                if (value) {
                    return when_constant(value, function (_, num) {
                        return num === num >>> 0 ? value : null;
                    }) || [ "call", sp_ref("toUint"), [ value ] ];
                } else {
                    return [ "num", 0 ];
                }
            },
            "Number": function convert_number(value) {
                if (value) {
                    return when_constant(value, function (_, num) {
                        return num === Number(num) ? value : null;
                    }) || [ "call", [ "name", "Number" ], [ value ] ];
                } else {
                    return [ "name", "NaN" ];
                }
            },
            "Boolean": function convert_boolean(value) {
                if (value) {
                    return when_constant(value, function (_, num) {
                        return num === Boolean(num) ? value : null;
                    }) || [ "call", [ "name", "Boolean" ], [ value ] ];
                } else {
                    return [ "name", "false" ];
                }
            },
            "String": function convert_boolean(value) {
                if (value) {
                    return value;
                } else {
                    return [ "name", "null" ];
                }
            }
        };

        ast = ast_visit(ast, function (visitor) {
            function rewrite_def(def) {
                if (def[2] && HOP(convertors, def[2])) {
                    // Convertable
                    return [ def[0], convertors[def[2]](def[1]), def[2] ];
                } else {
                    return def;
                }
            }

            return {
                "property": function(defs, modifiers) {
                    return [ this[0], MAP(defs, rewrite_def), modifiers ];
                },
                "var": function(defs) {
                    return [ this[0], MAP(defs, rewrite_def) ];
                },
                "const": function(defs) {
                    return [ this[0], MAP(defs, rewrite_def) ];
                }
            };
        }, copy_visit);

        ast = ast_scope_annotate(ast, globals);

        var spGlobals = {
            "trace": sp_ref("trace"),
            "int": sp_ref("toInt"),
            "uint": sp_ref("toUint")
        };

        // ...
        ast = w.with_walkers({
                "class": klass,
                "method": method,
                "getter": method,
                "setter": method,
                "function": _lambda,
                "defun": _lambda,
                "property": function(defs, modifiers) {
                        // Properties are handled specially by callers.  Here,
                        // we are just rewriting the property's name.
                        return with_scope(new Scope(scope), function() {
                                scope.modifiers = modifiers;

                                return [ this[0], MAP(defs, function(def) {
                                        return [
                                                get_rewritten(def[0], true),
                                                walk(def[1]),
                                                def[2]
                                        ];
                                }), modifiers ];
                        });
                },
                "name": function(name) {
                        if (HOP(spGlobals, name)) {
                                return spGlobals[name];
                        }

                        // TODO clean this up a bit
                        if (name.def_scope instanceof ClassScope && name.def_scope.class_name != name) {
                                var self_name;

                                if (name.is_static) {
                                        self_name = get_name_ast(name.def_scope.class_name);
                                } else {
                                        self_name = get_this_node();
                                        scope.reference(self_name[1]);
                                }

                                return [ "dot", self_name, name ];
                        } else {
                                return get_name_ast(name);
                        }
                },
                "toplevel": function(body) {
                        var self = this;
                        return with_scope(self.scope, function(){
                                return [ self[0], MAP(body, walk) ];
                        });
                },
        }, function() {
                return walk(ast);
        });

        ast = ast_visit(ast, scoped_visit, function (visitor) {
            function var_defs(defs) {
                return [ this[0], MAP(defs, function(def){
                    // def = [ name, expr?, type? ]
                    // Return just name and optional value
                    return [ get_rewritten(def[0], true), walk(def[1]) ];
                }) ];
            }

            return {
                "var": var_defs,
                "const": var_defs,
            };
        }, copy_visit);

        ast = ast_visit(ast, scoped_visit, function (visitor) {
            function lambda(name, args, body, returnType, modifiers) {
                return [ this[0], name, args.map(function (arg) {
                    return [ arg[0] ];
                }), MAP(body, visitor.visit) ];
            }

            return {
                "function": lambda,
                "defun": lambda
            };
        }, copy_visit);

        ast = ast_visit(ast, {
            // TODO This does not remove all instances
            // (e.g. in if statements)!
            "stat": function (statement) {
                if (is_name_referenced("Security", statement, false)) {
                    warn("Security not supported; code removed: " + gen_code(statement));
                    return [ "atom", "/* Security code removed */" ];
                }
            }
        }, copy_visit);

        ast = remove_unused_imports(ast);
        return ast;
};

function is_module_definition(ast) {
            // Not very sturdy
    return ast[0] == "call"
        && ast[1][0] == "name"
        && ast[1][1] == "define";
}

function define_visitor(callback) {
    return {
        "call": function(expr, args) {
            if (!is_module_definition(this)) {
                return /* undefined */;
            }

            var defineImports = args[0][1].map(function (imp) {
                return imp[1];
            });

            var defineNames = args[1][2].map(function (arg) {
                return arg[0];
            });

            var newCallArgs = callback(defineImports, defineNames, args[1][3]);
            if (newCallArgs) {
                return [ this[0], expr, [
                    [ "array", newCallArgs[0] ],
                    [ "function", null, newCallArgs[1], newCallArgs[2] ]
                ] ];
            }

            // return undefined;
        }
    };
}

function get_dependency_weights(ast) {
    var weights = { };

    var define_visit = define_visitor(function (imports, argNames, statements) {
        argNames.forEach(function (name, i) {
            var ref_scopes = name.ref_scopes.filter(function (scope) {
                return scope.global === ast.scope;
            });

            weights[imports[i] + ".js"] = ref_scopes.length;
        });
    });

    ast = ast_make_names(ast);
    ast = ast_scope_annotate(ast);
    ast_visit(ast, define_visit, copy_visit);

    return weights;
}

function merge_modules(names, asts) {
    var allImports = [ ];
    var allArgNames = [ ];
    var allStats = [ ];
    var allReturns = [ ];

    // Collect all statements, return values, etc. of modules
    asts.forEach(function (ast) {
        ast_visit(ast, define_visitor(function (imports, argNames, stats) {
            allImports.push.apply(allImports, imports);
            allArgNames.push.apply(allArgNames, argNames);

            stats = stats.slice();

            var returns = stats.filter(function (stat) {
                return stat[0] == "return";
            });

            if (returns.length === 1) {
                allReturns.push(returns[0][1]);

                stats = stats.filter(function (stat) {
                    return stat[0] != "return";
                });
            } else {
                allReturns.push(null);
            }

            allStats.push.apply(allStats, stats);
        }), copy_visit);
    });

    // Strip imports
    var i = allImports.length;
    while (i --> 0) {
        if (names.indexOf(allImports[i]) >= 0) {
            allArgNames.splice(i, 1);
            allImports.splice(i, 1);
        }
    }

    // Collect return values into an object
    var returnValuePairs = [ ];
    names.forEach(function (name, i) {
        var retval = allReturns[i] || [ "name", "undefined" ];
        returnValuePairs.push([ name, retval ]);
    });

    // Build define call
    var mergedModule = [ "call", [ "name", "define" ], [
        [ "array", allImports.map(function (imp) { return [ "string", imp ]; }) ],
        [
            "function", null,
            allArgNames.map(function (name) { return [ name ]; }),
            allStats.concat([ [ "return", [ "object", returnValuePairs ] ] ])
        ]
    ] ];

    // Merge them by replacing the first module with the
    // merged module, and other modules with nothing.
    var isFirst = true;
    var newAst = ast_visit([ "toplevel", asts ], function (visitor) {
        return {
            "call": function (_, _) {
                if (is_module_definition(this)) {
                    if (isFirst) {
                        isFirst = false;
                        return mergedModule;
                    } else {
                        return [ "atom", "/* redacted */" ];
                    }
                }

                // return undefined;
            }
        };
    }, copy_visit);

    return remove_unused_imports(ast_make_names(newAst));
}

function remove_unused_imports(ast) {
    // ast assumed to have name objects.  Ugly, I know.

    var define_visit = define_visitor(function (imports, argNames, statements) {
        var unusedIndices = [ ];

        argNames.forEach(function (name, i) {
            var ref_scopes = name.ref_scopes.filter(function (scope) {
                return scope.global === ast.scope;
            });

            if (ref_scopes.length === 0) {
                unusedIndices.push(i);
            }
        });

        var imports = imports.slice();
        var argNames = argNames.slice();

        // Remove in reverse so indices stay in-tact
        unusedIndices.reverse();
        unusedIndices.forEach(function (index) {
            imports.splice(index, 1);
            argNames.splice(index, 1);
        });

        return [
            imports.map(function (imp) { return [ "string", imp ]; }),
            argNames.map(function (name) { return [ name ]; }),
            statements
        ];
    });

    ast = ast_scope_annotate(ast);
    return ast_visit(ast, define_visit, copy_visit);
}

function empty(b) {
        return !b || (b[0] == "block" && (!b[1] || b[1].length == 0));
};

function is_string(node) {
        return (node[0] == "string" ||
                node[0] == "unary-prefix" && node[1] == "typeof" ||
                node[0] == "binary" && node[1] == "+" &&
                (is_string(node[2]) || is_string(node[3])));
};

var when_constant = (function(){

        var $NOT_CONSTANT = {};

        // this can only evaluate constant expressions.  If it finds anything
        // not constant, it throws $NOT_CONSTANT.
        function evaluate(expr) {
                switch (expr[0]) {
                    case "string":
                    case "num":
                        return expr[1];
                    case "name":
                    case "atom":
                        switch (expr[1].toString()) {
                            case "true": return true;
                            case "false": return false;
                            case "NaN": return NaN;
                            case "null": return null;
                        }
                        break;
                    case "unary-prefix":
                        switch (expr[1]) {
                            case "!": return !evaluate(expr[2]);
                            case "typeof": return typeof evaluate(expr[2]);
                            case "~": return ~evaluate(expr[2]);
                            case "-": return -evaluate(expr[2]);
                            case "+": return +evaluate(expr[2]);
                        }
                        break;
                    case "binary":
                        var left = expr[2], right = expr[3];
                        switch (expr[1]) {
                            case "&&"         : return evaluate(left) &&         evaluate(right);
                            case "||"         : return evaluate(left) ||         evaluate(right);
                            case "|"          : return evaluate(left) |          evaluate(right);
                            case "&"          : return evaluate(left) &          evaluate(right);
                            case "^"          : return evaluate(left) ^          evaluate(right);
                            case "+"          : return evaluate(left) +          evaluate(right);
                            case "*"          : return evaluate(left) *          evaluate(right);
                            case "/"          : return evaluate(left) /          evaluate(right);
                            case "-"          : return evaluate(left) -          evaluate(right);
                            case "<<"         : return evaluate(left) <<         evaluate(right);
                            case ">>"         : return evaluate(left) >>         evaluate(right);
                            case ">>>"        : return evaluate(left) >>>        evaluate(right);
                            case "=="         : return evaluate(left) ==         evaluate(right);
                            case "==="        : return evaluate(left) ===        evaluate(right);
                            case "!="         : return evaluate(left) !=         evaluate(right);
                            case "!=="        : return evaluate(left) !==        evaluate(right);
                            case "<"          : return evaluate(left) <          evaluate(right);
                            case "<="         : return evaluate(left) <=         evaluate(right);
                            case ">"          : return evaluate(left) >          evaluate(right);
                            case ">="         : return evaluate(left) >=         evaluate(right);
                            case "in"         : return evaluate(left) in         evaluate(right);
                            case "instanceof" : return evaluate(left) instanceof evaluate(right);
                        }
                }
                throw $NOT_CONSTANT;
        };

        return function(expr, yes, no) {
                try {
                        var val = evaluate(expr), ast;
                        switch (typeof val) {
                            case "string": ast =  [ "string", val ]; break;
                            case "number": ast =  [ "num", val ]; break;
                            case "boolean": ast =  [ "name", String(val) ]; break;
                            case "object":
                                if (val === null) {
                                    ast = [ "name", "null" ];
                                    break;
                                }
                            default: throw new Error("Can't handle constant of type: " + (typeof val));
                        }
                        return yes.call(expr, ast, val);
                } catch(ex) {
                        if (ex === $NOT_CONSTANT) {
                                if (expr[0] == "binary"
                                    && (expr[1] == "===" || expr[1] == "!==")
                                    && ((is_string(expr[2]) && is_string(expr[3]))
                                        || (boolean_expr(expr[2]) && boolean_expr(expr[3])))) {
                                        expr[1] = expr[1].substr(0, 2);
                                }
                                else if (no && expr[0] == "binary"
                                         && (expr[1] == "||" || expr[1] == "&&")) {
                                    // the whole expression is not constant but the lval may be...
                                    try {
                                        var lval = evaluate(expr[2]);
                                        expr = ((expr[1] == "&&" && (lval ? expr[3] : lval))    ||
                                                (expr[1] == "||" && (lval ? lval    : expr[3])) ||
                                                expr);
                                    } catch(ex2) {
                                        // IGNORE... lval is not constant
                                    }
                                }
                                return no ? no.call(expr, expr) : null;
                        }
                        else throw ex;
                }
        };

})();

function is_constant(expr) {
        return when_constant(expr, function() {
                return true;
        }, function() {
                return false;
        });
};

/* -----[ re-generate code from the AST ]----- */

var DOT_CALL_NO_PARENS = jsp.array_to_hash([
        "name",
        "array",
        "object",
        "string",
        "dot",
        "sub",
        "call",
        "regexp"
]);

function make_string(str, ascii_only) {
        var dq = 0, sq = 0;
        str = str.replace(/[\\\b\f\n\r\t\x22\x27\u2028\u2029]/g, function(s){
                switch (s) {
                    case "\\": return "\\\\";
                    case "\b": return "\\b";
                    case "\f": return "\\f";
                    case "\n": return "\\n";
                    case "\r": return "\\r";
                    case "\t": return "\\t";
                    case "\u2028": return "\\u2028";
                    case "\u2029": return "\\u2029";
                    case '"': ++dq; return '"';
                    case "'": ++sq; return "'";
                }
                return s;
        });
        if (ascii_only) str = to_ascii(str);
        if (dq > sq) return "'" + str.replace(/\x27/g, "\\'") + "'";
        else return '"' + str.replace(/\x22/g, '\\"') + '"';
};

function to_ascii(str) {
        return str.replace(/[\u0080-\uffff]/g, function(ch) {
                var code = ch.charCodeAt(0).toString(16);
                while (code.length < 4) code = "0" + code;
                return "\\u" + code;
        });
};

var SPLICE_NEEDS_BRACKETS = jsp.array_to_hash([ "if", "while", "do", "for", "for-in", "with" ]);

function gen_code(ast, options) {
        options = defaults(options, {
                indent_start : 0,
                indent_level : 4,
                quote_keys   : false,
                space_colon  : false,
                beautify     : false,
                ascii_only   : false
        });
        var beautify = !!options.beautify;
        var indentation = 0,
            newline = beautify ? "\n" : "",
            space = beautify ? " " : "";

        function encode_string(str) {
                return make_string(str.toString(), options.ascii_only);
        };

        function make_name(name) {
                name = name.toString();
                if (options.ascii_only)
                        name = to_ascii(name);
                return name;
        };

        function indent(line) {
                if (line == null)
                        line = "";
                if (beautify)
                        line = repeat_string(" ", options.indent_start + indentation * options.indent_level) + line;
                return line;
        };

        function with_indent(cont, incr) {
                if (incr == null) incr = 1;
                indentation += incr;
                try { return cont.apply(null, slice(arguments, 1)); }
                finally { indentation -= incr; }
        };

        function add_spaces(a) {
                if (beautify)
                        return a.join(" ");
                var b = [];
                for (var i = 0; i < a.length; ++i) {
                        var next = a[i + 1];
                        b.push(a[i]);
                        if (next &&
                            ((/[a-z0-9_\x24]$/i.test(a[i].toString()) && /^[a-z0-9_\x24]/i.test(next.toString())) ||
                             (/[\+\-]$/.test(a[i].toString()) && /^[\+\-]/.test(next.toString())))) {
                                b.push(" ");
                        }
                }
                return b.join("");
        };

        function add_commas(a) {
                return a.join("," + space);
        };

        function parenthesize(expr) {
                var gen = make(expr);
                for (var i = 1; i < arguments.length; ++i) {
                        var el = arguments[i];
                        if ((el instanceof Function && el(expr)) || expr[0] == el)
                                return "(" + gen + ")";
                }
                return gen;
        };

        function best_of(a) {
                if (a.length == 1) {
                        return a[0];
                }
                if (a.length == 2) {
                        var b = a[1];
                        a = a[0];
                        return a.length <= b.length ? a : b;
                }
                return best_of([ a[0], best_of(a.slice(1)) ]);
        };

        function needs_parens(expr) {
                if (expr[0] == "function" || expr[0] == "object") {
                        // dot/call on a literal function requires the
                        // function literal itself to be parenthesized
                        // only if it's the first "thing" in a
                        // statement.  This means that the parent is
                        // "stat", but it could also be a "seq" and
                        // we're the first in this "seq" and the
                        // parent is "stat", and so on.  Messy stuff,
                        // but it worths the trouble.
                        var a = slice($stack), self = a.pop(), p = a.pop();
                        while (p) {
                                if (p[0] == "stat") return true;
                                if (((p[0] == "seq" || p[0] == "call" || p[0] == "dot" || p[0] == "sub" || p[0] == "conditional") && p[1] === self) ||
                                    ((p[0] == "binary" || p[0] == "assign" || p[0] == "unary-postfix") && p[2] === self)) {
                                        self = p;
                                        p = a.pop();
                                } else {
                                        return false;
                                }
                        }
                }
                return !HOP(DOT_CALL_NO_PARENS, expr[0]);
        };

        function make_num(num) {
                var str = num.toString(10), a = [ str.replace(/^0\./, ".") ], m;
                if (Math.floor(num) === num) {
                        a.push("0x" + num.toString(16).toLowerCase(), // probably pointless
                               "0" + num.toString(8)); // same.
                        if ((m = /^(.*?)(0+)$/.exec(num))) {
                                a.push(m[1] + "e" + m[2].length);
                        }
                } else if ((m = /^0?\.(0+)(.*)$/.exec(num))) {
                        a.push(m[2] + "e-" + (m[1].length + m[2].length),
                               str.substr(str.indexOf(".")));
                }
                return best_of(a);
        };

        var generators = {
                "string": encode_string,
                "num": make_num,
                "name": make_name,
                "toplevel": function(statements) {
                        return make_block_statements(statements)
                                .join(newline + newline);
                },
                "splice": function(statements) {
                        var parent = $stack[$stack.length - 2][0];
                        if (HOP(SPLICE_NEEDS_BRACKETS, parent)) {
                                // we need block brackets in this case
                                return make_block.apply(this, arguments);
                        } else {
                                return MAP(make_block_statements(statements, true),
                                           function(line, i) {
                                                   // the first line is already indented
                                                   return i > 0 ? indent(line) : line;
                                           }).join(newline);
                        }
                },
                "block": make_block,
                "var": function(defs) {
                        return "var " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "const": function(defs) {
                        return "const " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "try": function(tr, ca, fi) {
                        var out = [ "try", make_block(tr) ];
                        if (ca) out.push("catch", "(" + ca[0] + ")", make_block(ca[1]));
                        if (fi) out.push("finally", make_block(fi));
                        return add_spaces(out);
                },
                "throw": function(expr) {
                        return add_spaces([ "throw", make(expr) ]) + ";";
                },
                "new": function(ctor, args) {
                        args = "(" + add_commas(MAP(args, make)) + ")";
                        return add_spaces([ "new", parenthesize(ctor, "seq", "binary", "conditional", "assign", function(expr){
                                var w = ast_walker(), has_call = {};
                                try {
                                        w.with_walkers({
                                                "call": function() { throw has_call },
                                                "function": function() { return this }
                                        }, function(){
                                                w.walk(expr);
                                        });
                                } catch(ex) {
                                        if (ex === has_call)
                                                return true;
                                        throw ex;
                                }
                        }) + args ]);
                },
                "switch": function(expr, body) {
                        return add_spaces([ "switch", "(" + make(expr) + ")", make_switch_block(body) ]);
                },
                "break": function(label) {
                        var out = "break";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "continue": function(label) {
                        var out = "continue";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "conditional": function(co, th, el) {
                        return add_spaces([ parenthesize(co, "assign", "seq", "conditional"), "?",
                                            parenthesize(th, "seq"), ":",
                                            parenthesize(el, "seq") ]);
                },
                "assign": function(op, lvalue, rvalue) {
                        if (op && op !== true) op += "=";
                        else op = "=";
                        return add_spaces([ make(lvalue), op, parenthesize(rvalue, "seq") ]);
                },
                "dot": function(expr) {
                        var out = make(expr), i = 1;
                        if (expr[0] == "num") {
                                if (!/\./.test(expr[1]))
                                        out += ".";
                        } else if (needs_parens(expr))
                                out = "(" + out + ")";
                        while (i < arguments.length)
                                out += "." + make_name(arguments[i++]);
                        return out;
                },
                "call": function(func, args) {
                        var f = make(func);
                        if (needs_parens(func))
                                f = "(" + f + ")";
                        return f + "(" + add_commas(MAP(args, function(expr){
                                return parenthesize(expr, "seq");
                        })) + ")";
                },
                "function": make_function,
                "defun": make_function,
                "if": function(co, th, el) {
                        var out = [ "if", "(" + make(co) + ")", el ? make_then(th) : make(th) ];
                        if (el) {
                                out.push("else", make_else(el));
                        }
                        return add_spaces(out);
                },
                "for": function(init, cond, step, block) {
                        var out = [ "for" ];
                        init = (init != null ? make(init) : "").replace(/;*\s*$/, ";" + space);
                        cond = (cond != null ? make(cond) : "").replace(/;*\s*$/, ";" + space);
                        step = (step != null ? make(step) : "").replace(/;*\s*$/, "");
                        var args = init + cond + step;
                        if (args == "; ; ") args = ";;";
                        out.push("(" + args + ")", make(block));
                        return add_spaces(out);
                },
                "for-in": function(vvar, key, hash, block) {
                        return add_spaces([ "for", "(" +
                                            (vvar ? make(vvar).replace(/;+$/, "") : make(key)),
                                            "in",
                                            make(hash) + ")", make(block) ]);
                },
                "while": function(condition, block) {
                        return add_spaces([ "while", "(" + make(condition) + ")", make(block) ]);
                },
                "do": function(condition, block) {
                        return add_spaces([ "do", make(block), "while", "(" + make(condition) + ")" ]) + ";";
                },
                "return": function(expr) {
                        var out = [ "return" ];
                        if (expr != null) out.push(make(expr));
                        return add_spaces(out) + ";";
                },
                "binary": function(operator, lvalue, rvalue) {
                        var left = make(lvalue), right = make(rvalue);
                        // XXX: I'm pretty sure other cases will bite here.
                        //      we need to be smarter.
                        //      adding parens all the time is the safest bet.
                        if (member(lvalue[0], [ "assign", "conditional", "seq" ]) ||
                            lvalue[0] == "binary" && PRECEDENCE[operator] > PRECEDENCE[lvalue[1]]) {
                                left = "(" + left + ")";
                        }
                        if (member(rvalue[0], [ "assign", "conditional", "seq" ]) ||
                            rvalue[0] == "binary" && PRECEDENCE[operator] >= PRECEDENCE[rvalue[1]] &&
                            !(rvalue[1] == operator && member(operator, [ "&&", "||", "*" ]))) {
                                right = "(" + right + ")";
                        }
                        return add_spaces([ left, operator, right ]);
                },
                "unary-prefix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-prefix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return operator + (jsp.is_alphanumeric_char(operator.charAt(0)) ? " " : "") + val;
                },
                "unary-postfix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-postfix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return val + operator;
                },
                "sub": function(expr, subscript) {
                        var hash = make(expr);
                        if (needs_parens(expr))
                                hash = "(" + hash + ")";
                        return hash + "[" + make(subscript) + "]";
                },
                "object": function(props) {
                        if (props.length == 0)
                                return "{}";
                        return "{" + newline + with_indent(function(){
                                return MAP(props, function(p){
                                        if (p.length == 3) {
                                                // getter/setter.  The name is in p[0], the arg.list in p[1][2], the
                                                // body in p[1][3] and type ("get" / "set") in p[2].
                                                return indent(make_function(p[0], p[1][2], p[1][3], p[2]));
                                        }
                                        var key = p[0], val = make(p[1]);
                                        if (options.quote_keys) {
                                                key = encode_string(key);
                                        } else if ((typeof key == "number" || !beautify && +key + "" == key)
                                                   && parseFloat(key) >= 0) {
                                                key = make_num(+key);
                                        } else if (!is_identifier(key)) {
                                                key = encode_string(key);
                                        }
                                        return indent(add_spaces(beautify && options.space_colon
                                                                 ? [ key, ":", val ]
                                                                 : [ key + ":", val ]));
                                }).join("," + newline);
                        }) + newline + indent("}");
                },
                "regexp": function(rx, mods) {
                        return "/" + rx + "/" + mods;
                },
                "array": function(elements) {
                        if (elements.length == 0) return "[]";
                        return add_spaces([ "[", add_commas(MAP(elements, function(el){
                                if (!beautify && el[0] == "atom" && el[1] == "undefined") return "";
                                return parenthesize(el, "seq");
                        })), "]" ]);
                },
                "stat": function(stmt) {
                        return make(stmt).replace(/;*\s*$/, ";");
                },
                "seq": function() {
                        return add_commas(MAP(slice(arguments), make));
                },
                "label": function(name, block) {
                        return add_spaces([ make_name(name), ":", make(block) ]);
                },
                "with": function(expr, block) {
                        return add_spaces([ "with", "(" + make(expr) + ")", make(block) ]);
                },
                "atom": function(name) {
                        return make_name(name);
                }
        };

        // The squeezer replaces "block"-s that contain only a single
        // statement with the statement itself; technically, the AST
        // is correct, but this can create problems when we output an
        // IF having an ELSE clause where the THEN clause ends in an
        // IF *without* an ELSE block (then the outer ELSE would refer
        // to the inner IF).  This function checks for this case and
        // adds the block brackets if needed.
        function make_then(th) {
                if (beautify && th[0] != "block") {
                        return make([ "block", [ th ] ]);
                }

                if (th[0] == "do") {
                        // https://github.com/mishoo/UglifyJS/issues/#issue/57
                        // IE croaks with "syntax error" on code like this:
                        //     if (foo) do ... while(cond); else ...
                        // we need block brackets around do/while
                        return make([ "block", [ th ]]);
                }
                var b = th;
                while (true) {
                        var type = b[0];
                        if (type == "if") {
                                if (!b[3])
                                        // no else, we must add the block
                                        return make([ "block", [ th ]]);
                                b = b[3];
                        }
                        else if (type == "while" || type == "do") b = b[2];
                        else if (type == "for" || type == "for-in") b = b[4];
                        else break;
                }
                return make(th);
        };

        function make_else(el) {
                if (beautify && el[0] != "block") {
                        return make([ "block", [ el ] ]);
                } else {
                        return make(el);
                }
        };

        function make_function(name, args, body, keyword) {
                var out = keyword || "function";
                if (name) {
                        out += " " + make_name(name);
                }
                args = MAP(args, function (arg) {
                        return make_name(Array.isArray(arg) ? arg[0] : arg);
                });
                out += "(" + add_commas(args) + ")";
                return add_spaces([ out, make_block(body) ]);
        };

        function make_block_statements(statements, noindent) {
                for (var a = [], last = statements.length - 1, i = 0; i <= last; ++i) {
                        var stat = statements[i];
                        var code = make(stat);
                        if (code != ";") {
                                if (!beautify && i == last) {
                                        if ((stat[0] == "while" && empty(stat[2])) ||
                                            (member(stat[0], [ "for", "for-in"] ) && empty(stat[4])) ||
                                            (stat[0] == "if" && empty(stat[2]) && !stat[3]) ||
                                            (stat[0] == "if" && stat[3] && empty(stat[3]))) {
                                                code = code.replace(/;*\s*$/, ";");
                                        } else {
                                                code = code.replace(/;+\s*$/, "");
                                        }
                                }
                                a.push(code);
                        }
                }
                return noindent ? a : MAP(a, indent);
        };

        function make_switch_block(body) {
                var n = body.length;
                if (n == 0) return "{}";
                return "{" + newline + MAP(body, function(branch, i){
                        var has_body = branch[1].length > 0, code = with_indent(function(){
                                return indent(branch[0]
                                              ? add_spaces([ "case", make(branch[0]) + ":" ])
                                              : "default:");
                        }, 0.5) + (has_body ? newline + with_indent(function(){
                                return make_block_statements(branch[1]).join(newline);
                        }) : "");
                        if (!beautify && has_body && i < n - 1)
                                code += ";";
                        return code;
                }).join(newline) + newline + indent("}");
        };

        function make_block(statements) {
                if (!statements) return ";";
                if (statements.length == 0) return "{}";
                return "{" + newline + with_indent(function(){
                        return make_block_statements(statements).join(newline);
                }) + newline + indent("}");
        };

        function make_1vardef(def) {
                var name = def[0], val = def[1];
                if (val != null)
                        name = add_spaces([ make_name(name), "=", parenthesize(val, "seq") ]);
                return name;
        };

        var $stack = [];

        function make(node) {
                var type = node[0];
                var gen = generators[type];
                if (!gen)
                        throw new Error("Can't find generator for \"" + type + "\"");
                $stack.push(node);
                var ret = gen.apply(type, node.slice(1));
                $stack.pop();
                return ret;
        };

        return make(ast);
};

function split_lines(code, max_line_length) {
        var splits = [ 0 ];
        jsp.parse(function(){
                var next_token = jsp.tokenizer(code);
                var last_split = 0;
                var prev_token;
                function current_length(tok) {
                        return tok.pos - last_split;
                };
                function split_here(tok) {
                        last_split = tok.pos;
                        splits.push(last_split);
                };
                function custom(){
                        var tok = next_token.apply(this, arguments);
                        out: {
                                if (prev_token) {
                                        if (prev_token.type == "keyword") break out;
                                }
                                if (current_length(tok) > max_line_length) {
                                        switch (tok.type) {
                                            case "keyword":
                                            case "atom":
                                            case "name":
                                            case "punc":
                                                split_here(tok);
                                                break out;
                                        }
                                }
                        }
                        prev_token = tok;
                        return tok;
                };
                custom.context = function() {
                        return next_token.context.apply(this, arguments);
                };
                return custom;
        }());
        return splits.map(function(pos, i){
                return code.substring(pos, splits[i + 1] || code.length);
        }).join("\n");
};

/* -----[ Utilities ]----- */

function repeat_string(str, i) {
        if (i <= 0) return "";
        if (i == 1) return str;
        var d = repeat_string(str, i >> 1);
        d += d;
        if (i & 1) d += str;
        return d;
};

function defaults(args, defs) {
        var ret = {};
        if (args === true)
                args = {};
        for (var i in defs) if (HOP(defs, i)) {
                ret[i] = (args && HOP(args, i)) ? args[i] : defs[i];
        }
        return ret;
};

function is_identifier(name) {
        return /^[a-z_$][a-z0-9_$]*$/i.test(name)
                && name != "this"
                && !HOP(jsp.KEYWORDS_ATOM, name)
                && !HOP(jsp.RESERVED_WORDS, name)
                && !HOP(jsp.KEYWORDS, name);
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

function unique(array) {
        return array.reduce(function(acc, item) {
                if (acc.indexOf(item) >= 0)
                        return acc;
                else
                        return acc.concat([ item ]);
        }, []);
};

// some utilities

var MAP;

(function(){
        MAP = function(a, f, o) {
                var ret = [];
                for (var i = 0; i < a.length; ++i) {
                        var val = f.call(o, a[i], i);
                        if (val instanceof AtTop) ret.unshift(val.v);
                        else ret.push(val);
                }
                return ret;
        };
        MAP.at_top = function(val) { return new AtTop(val) };
        function AtTop(val) { this.v = val };
})();

/* -----[ Exports ]----- */

function get_exports(ast) {
        var w = ast_walker(), walk = w.walk;
        var package_stack = [];
        var exports = [];

        w.with_walkers({
                "package": function(name, statements) {
                        package_stack.push(name);
                        MAP(statements, walk);
                        package_stack.pop();
                        return [];
                },
                "class": function(name) {
                        exports.push([ package_stack.join("."), new ExportName(name) ]);
                        return [];
                }
        }, function() {
                return walk(ast_scope_annotate(ast_make_names(ast)));
        });

        return exports;
};

var warn = console.warn;

exports.ast_walker = ast_walker;
exports.rewrite = rewrite;
exports.get_dependency_weights = get_dependency_weights;
exports.merge_modules = merge_modules;
exports.remove_unused_imports = remove_unused_imports;
exports.ast_make_names = ast_make_names;
exports.gen_code = gen_code;
exports.ast_scope_annotate = ast_scope_annotate;
exports.set_logger = function(logger) { warn = logger };
exports.make_string = make_string;
exports.split_lines = split_lines;
exports.MAP = MAP;
exports.get_exports = get_exports;
exports.Name = Name;
exports.ExportName = ExportName;
exports.ClassScope = ClassScope;

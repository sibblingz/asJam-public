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

var jsp = require("./parse"),
    slice = jsp.slice,
    member = jsp.member,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;

/* -----[ helper for AST traversal ]----- */

function ast_walker(ast) {
        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(def){
                        var a = [ def[0], def[1] ];
                        if (def.length > 2)
                                a[2] = walk(def[2]);
                        return a;
                }) ];
        };

        function _block(statements) {
                var out = [ this[0] ];
                if (statements != null)
                        out.push(MAP(statements, walk));
                return out;
        };

        function _lambda(name, args, body, returnType, modifiers) {
                return [ this[0], name, args.slice(), MAP(body, walk), returnType, modifiers.slice() ];
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
                "try": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                MAP(c, function(cc){
                                        return [ cc[0], MAP(cc[1], walk) ];
                                }),
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
                "package": function(name, statements) {
                        return [ this[0], name, MAP(statements, walk) ];
                },
                "import": function(name) {
                        return [ this[0], name ];
                },
                "property": function(name, type, value, modifiers) {
                        return [ this[0], name, type, walk(value), modifiers.slice() ];
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

function ClassScope(parent) {
        Scope.call(this, parent);
};

ClassScope.prototype = new Scope();

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
};

Name.prototype.toString = function() {
        return this.string;
};

Name.prototype.rename = function(newString) {
        this.string = newString;
};

Name.prototype.referenced_by = function(scope) {
        return this.ref_scopes.indexOf(scope) >= 0;
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

function ast_scope_annotate(ast) {
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

        function define(nameString) {
                var name;
                if (typeof nameString == "string") {
                        name = new Name(nameString);
                } else {
                        name = nameString;
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
                var is_outer_named = this[0] != "function";
                var is_class_member = is_outer_named && !is_defun;

                if (is_outer_named && name) define(name);

                var scope = new Scope(current_scope);
                with_scope(scope, function(){
                        var scope = new Scope(current_scope);

                        if (!is_defun && name) define(name);

                        with_scope(scope, function(){
                                if (is_class_member) scope.self_name = scope.define(new Name(""));
                                scope.define(new ImmutableName("arguments"));
                                scope.define(new ImmutableName("this"));

                                MAP(args, function(arg) {
                                        define(arg[0]);
                                });
                                body = annotate(MAP(body, walk), scope);
                        });
                });

                return annotate([ this[0], name, args, body, returnType, modifiers ], scope);
        };

        function var_defs(defs) {
                MAP(defs, function(d){ define(d[0]) });
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
                                return [ [ define(cc[0][0]), cc[0][1] ], MAP(cc[1], walk) ];
                        }),
                        f != null ? MAP(f, walk) : null
                ];
        };

        function toplevel(statements) {
                var scope = new Scope(current_scope);
                with_scope(scope, function() {
                        statements = MAP(statements, walk);
                });

                return annotate([ this[0], statements ], scope);
        };

        function klass(name, members, superclass) {
                var scope = new ClassScope(current_scope);
                with_scope(scope, function() {
                        define(name);
                        members = MAP(members, walk);
                });

                return annotate([ this[0], name, members, superclass ], scope);
        };

        function scoped(callback) {
                return function() {
                        var scope = this.scope;
                        if (!scope) throw new Error("Inconsistent scope with " + n[0]);

                        current_scope = scope;
                        return annotate(callback.apply(this, arguments), scope);
                };
        };

        function scoped_lambda() {
                return scoped(function(name, args, body, returnType, members) {
                        body = annotate(MAP(body, walk), body.scope);
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
                "try": try_block,
                "with": with_block,
                "class": klass,
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
                "function": scoped_lambda,
                "defun": scoped_lambda,
                "method": scoped_lambda,
                "getter": scoped_lambda,
                "setter": scoped_lambda,
                "try": function(t, c, f) {
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

function ast_make_names(ast) {
        if (!ast.scope) ast = ast_scope_annotate(ast);

        var current_scope = null;
        var w = ast_walker(), walk = w.walk;

        function with_scope(scope, cont) {
                var old_scope = current_scope;
                current_scope = scope;
                var ret = cont();
                current_scope = old_scope;
                return ret;
        };

        function scoped() {
                if (!this.scope) throw new Error("Inconsistent scope with " + this[0]);
                current_scope = this.scope;
        };

        function lambda(name, args, body, returnType, modifiers) {
                var is_defun = this[0] == "defun";
                var defined_name = null;
                if (is_defun && name) defined_name = current_scope.get_name(name);

                scoped.call(this);
                if (!is_defun && name) defined_name = current_scope.get_name(name);

                scoped.call(body);
                args = MAP(args, function(arg) {
                        return [
                                current_scope.get_name(arg[0]),
                                arg[1], // TODO rewrite
                                arg[2] ? walk(arg[2]) : null
                        ];
                });
                body = MAP(body, walk);

                returnType = returnType; // TODO rewrite

                return [ this[0], defined_name, args, body, returnType, slice(modifiers) ];
        };

        function var_defs(defs) {
                defs = MAP(defs, function(d) {
                        return [ current_scope.get_name(d[0]), d[1] ? current_scope.get_name(d[1]) : null, walk(d[2]) ];
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

        function name(name) {
                return [ this[0], current_scope.get_name(name) ];
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
                "try": try_block,
                "with": scoped,
                "toplevel": scoped,
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

function rewrite(ast) {
        ast = ast_scope_annotate(ast_make_names(ast));

        var w = ast_walker(), walk = w.walk, scope;

        var member_name_manglers = {
                "public": function(name) {
                        return name;
                },
                "protected": function(name) {
                        return name;
                },
                "private": function(name) {
                        // TODO mangle name based on class name to prevent
                        // clashing.  This kinda ruins the human aspect of the
                        // output, though...  =\
                        return "_" + name;
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
                if (scope.modifiers) return true;
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
                };

                try {
                        var subw = ast_walker();
                        subw.with_walkers({
                                "name": function(curName) {
                                        if (typeof name == "string") {
                                                curName = curName.toString();
                                        }

                                        if (curName.toString() == name) {
                                                throw is_referenced;
                                        }
                                },
                                "function": maybe_new_scope,
                                "defun": maybe_new_scope,
                                "method": maybe_new_scope,
                                "class": maybe_new_scope
                        }, function() {
                                return subw.walk(ast);
                        });
                } catch (e) {
                        if (e == is_referenced) {
                                return true;
                        }

                        throw e;
                }

                return false;
        };

        function with_scope(s, cont) {
                var _scope = scope;
                scope = s;
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

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
        };

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
                            statement = [ "var", [ [ argName, null, splatValueNode ] ] ];

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
        };

        function _lambda(name, args, body, returnType, modifiers) {
                var is_defun = this[0] == "defun";
                var is_method = this[0] == "method";
                if (is_defun && name) name = get_rewritten(name, true, is_method);

                var argNames;

                body = with_scope(body.scope, function(){
                        scope.modifiers = modifiers;

                        if (!is_defun && name) name = get_rewritten(name, true, is_method);

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
                        argNames = t.names;
                        body = body.concat(t.statements);

                        body = MAP(body, walk);

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

                        return body;
                });

                return [ this[0], name, argNames, body ];
        };

        function method(name, args, body, returnType, modifiers) {
                var lambda = _lambda.call(this, name, args, body, returnType, modifiers);

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
                return [ "name", "sp" ];
        };

        function get_this_node() {
                var self_name = scope.get_self_name();
                return [ "name", self_name ];
        };

        function sp_ref(/* ... */) {
                return [ "dot", get_sp_node() ].concat(slice(arguments));
        };

        function property_member(property) {
                if (property[3] && is_constant(property[3]))
                        return [ property[1], property[3] ];

                return [ property[1], [ "name", "null" ] ];
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

        function constructor_member(constructor, properties) {
                var constructorCalls = properties.map(function(prop) {
                        // FIXME "self" is not used, causing
                        // inconsistent code.

                        var name = prop[1];
                        var value = prop[3];

                        return [ "stat", [ "assign",
                                "",
                                [ "dot", [ "name", "this" ], name ],
                                value
                        ] ];
                });

                if (constructor == null && constructorCalls.length) {
                        // To assign properties, we need a constructor
                        constructor = [ "function", name, [ ], [ ] ];
                }

                if (constructor != null) {
                        constructor[3] = constructorCalls.concat(constructor[3]);
                        return [ "constructor", constructor ];
                }

                return null;
        };

        function klass(name, members, superclass) {
                var classCreateNode = [ "dot", [ "name", "Class" ], "create" ];
                var bodyChildrenNodes = [ ];

                var constructor = null;

                var methods = [ ];
                var properties = [ ];

                var getters = { };
                var setters = { };
                var gettersSetters = { };

                // Sort the class members by type
                members.forEach(function(member) {
                        var memberName;

                        switch (member[0]) {
                            case "method":
                                if (member[1] == name) {
                                        constructor = walk(member);
                                } else {
                                        methods.push(member);
                                }

                                break;

                            case "property":
                                properties.push(walk(member));

                                break;

                            case "getter":
                                member = walk(member);
                                memberName = member[1].toString();

                                gettersSetters[memberName] = true;
                                getters[memberName] = member;
                                member[1].rename("get_" + memberName);

                                break;

                            case "setter":
                                member = walk(member);
                                memberName = member[1].toString();

                                gettersSetters[memberName] = true;
                                setters[memberName] = member;
                                member[1].rename("set_" + memberName);

                                break;
                        }
                });

                var properties_with_value = properties.filter(function(prop) {
                        var value = prop[3];
                        return value && !is_constant(value);
                });

                // Constructor
                var constructor_pair = constructor_member(constructor, properties_with_value);
                if (constructor_pair) bodyChildrenNodes.push(constructor_pair);

                // Instance methods
                var instance_methods = methods.filter(function(method) {
                        return method[5].indexOf("static") < 0;
                }).map(walk);

                var instance_method_pairs = instance_methods.map(method_member);
                if (instance_method_pairs.length > 0) {
                        bodyChildrenNodes.push([ "methods", [ "object", instance_method_pairs ] ]);
                }

                // Instance properties
                var instance_getter_setter_pairs = Object.keys(gettersSetters).map(function(getterSetterName) {
                        var getter, setter;

                        if (HOP(getters, getterSetterName))
                                getter = getters[getterSetterName];

                        if (HOP(setters, getterSetterName))
                                setter = setters[getterSetterName];

                        return getter_setter_member(getterSetterName, getter, setter);
                });

                var instance_property_pairs = properties.map(property_member).concat(instance_getter_setter_pairs);

                if (instance_property_pairs.length > 0) {
                        bodyChildrenNodes.push([ "properties", [ "object", instance_property_pairs ] ]);
                }

                // Statics
                var static_methods = methods.filter(function(method) {
                        return method[5].indexOf("static") >= 0;
                }).map(walk);

                var static_properties = [ ]; // TODO

                var static_method_pairs = static_methods.map(method_member);
                var static_property_pairs = static_properties.map(property_member);
                var static_getter_setter_pairs = [ ]; // TODO

                var static_pairs = static_method_pairs.concat(static_property_pairs);

                if (static_pairs.length > 0) {
                        bodyChildrenNodes.push([ "statics", [ "object", static_pairs ] ]);
                }

                // Class.create
                var bodyNode = [ "object", bodyChildrenNodes ];
                var args = [ bodyNode ];

                if (superclass) {
                        args.unshift(walk(superclass));
                }

                var madeClassNode = [ "call", classCreateNode, args ];

                return [ "var", [ [ name, madeClassNode ] ] ];
        };

        return w.with_walkers({
                "package": function(name, statements) {
                        function rewrite_fqn(fqn /* ... */) {
                                return MAP(arguments, function(fqn){
                                        return fqn.replace(".", "/");
                                }).filter(function(x){
                                        return !!x;
                                }).join("/");
                        }

                        statements = MAP(statements, walk);

                        var define = [ "name", "define" ];

                        var imports = statements.filter(function(node) {
                                return node[0] == "import";
                        }).map(function(node) {
                                return node[1];
                        });

                        statements = statements.filter(function(node) {
                                return node[0] != "import";
                        });

                        // TODO Add imports as args, etc.
                        var importStrings = [ "array", [ ] ];
                        var importArguments = [ ];

                        // HACK
                        var className = statements[statements.length - 1][1][0][0].toString();

                        return [ "call", define, [
                                [ "string", rewrite_fqn(name, className) ],
                                importStrings,
                                [ "function", "", importArguments, statements.concat([ 
                                        [ "return", [ "name", className ] ] // HACK
                                ]) ]
                        ] ];
                },
                "class": klass,
                "method": method,
                "getter": method,
                "setter": method,
                "property": function(name, type, value, modifiers) {
                        // Properties are handled specially by callers.  Here,
                        // we are just rewriting the property's name.
                        return with_scope(new Scope(scope), function() {
                                scope.modifiers = modifiers;

                                return [ this[0], get_rewritten(name, true), type, value, modifiers ];
                        });
                },
                "var": function(defs) {
                        return [ this[0], MAP(defs, function(def){
                                // def = [ name, type, expr? ]
                                // Return just name and optional value
                                var a = [ get_rewritten(def[0], true) ];
                                if (def.length > 2)
                                        a[1] = walk(def[2]);
                                return a;
                        }) ];
                },
                "function": _lambda,
                "defun": _lambda,
                "for-each": function(vvar, key, hash, block) {
                        // TODO Store the hash somewhere so we don't
                        // evaluate it once (or more) per iteration.

                        var new_key_name = new Name("");
                        scope.define(new_key_name);
                        rewrite_name(scope, new_key_name, "key");

                        var new_key = [ "name", new_key_name ];

                        var hop_check = [ "if",
                                [ "unary-prefix", "!", [ "call",
                                        [ "dot", [ "object", [ ] ], "hasOwnProperty", "call" ],
                                        [ hash, new_key ]
                                ] ],
                                [ "continue" ],
                                null
                        ];

                        var assign;
                        var value = [ "sub", hash, new_key ];

                        if (vvar[0] == "name") {
                                // User wrote for each(x ..); write x = in the
                                // body.
                                assign = [ "assign", "", key, value ];
                        } else {
                                // User wrote for each(var x ..) or for
                                // each(const x ..); write var x = or const x =
                                // in the body.
                                //
                                // TODO investigate for each(var x, y, z ..)
                                assign = [ vvar[0], [ [ vvar[1][0][0], value ] ] ];
                        }

                        return [ "for-in",
                                [ "var", [ [ new_key_name ] ] ],
                                new_key_name,
                                walk(hash),
                                [ "block", [ hop_check, assign ].concat(walk(block)[1]) ]
                        ];
                },
                "name": function(name) {
                        // TODO
                        if (name.def_scope instanceof ClassScope) {
                                var self_name = get_this_node();
                                scope.reference(self_name[1]);
                                return [ "dot", self_name, name ];
                        } else {
                                return [ "name", name ];
                        }
                },
                "toplevel": function(body) {
                        var self = this;
                        return with_scope(self.scope, function(){
                                return [ self[0], MAP(body, walk) ];
                        });
                },
                "try": function(t, c, f) {
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
                                MAP(c, function(cc){
                                        if (cc[0][0] != catch_name)
                                                throw new Error("Catch statements with different names not supported");
                                });

                                var ifs = [ ];
                                var el = null;
                                MAP(c, function(cc){
                                        if (cc[0][1] == "*" || cc[0][1] == null) {
                                                if (el) throw new Error("Catch statements cannot overlap");
                                                el = MAP(cc[1], walk);
                                        } else {
                                                ifs.push([ "if",
                                                        [ "binary", "instanceof", [ "name", catch_name ], [ "name", cc[0][1] ] ],
                                                        [ "block", MAP(cc[1], walk) ],
                                                        null
                                                ]);
                                        }
                                })

                                if (!el) el = [ "block", [ [ "throw", [ "name", catch_name ] ] ] ];

                                var bodyNode = null;
                                var curNode = null;
                                MAP(ifs.concat([ el ]), function(if_) {
                                        if (curNode) curNode[3] = if_;
                                        else bodyNode = if_;

                                        curNode = if_;
                                });

                                c = [ catch_name, [ bodyNode ] ];
                        } else {
                                c = null;
                        }

                        return [
                                this[0],
                                MAP(t, walk),
                                c,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "binary": function(operator, lvalue, rvalue) {
                        if (operator == "is") {
                                return [ "call", sp_ref("is"), [ walk(lvalue), walk(rvalue) ] ];
                        }

                        if (operator == "as") {
                                return [ "call", sp_ref("as"), [ walk(lvalue), walk(rvalue) ] ];
                        }
                }
        }, function() {
                ast = walk(ast);
                //n(ast);
                return ast;
        });
};

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
                        switch (expr[1]) {
                            case "true": return true;
                            case "false": return false;
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
                        args = args.length > 0 ? "(" + add_commas(MAP(args, make)) + ")" : "";
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
                                out.push("else", make(el));
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

        function make_function(name, args, body, keyword) {
                var out = keyword || "function";
                if (name) {
                        out += " " + make_name(name);
                }
                out += "(" + add_commas(MAP(args, make_name)) + ")";
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

exports.ast_walker = ast_walker;
exports.rewrite = rewrite;
exports.gen_code = gen_code;
exports.ast_scope_annotate = ast_scope_annotate;
exports.set_logger = function(logger) { warn = logger };
exports.make_string = make_string;
exports.split_lines = split_lines;
exports.MAP = MAP;

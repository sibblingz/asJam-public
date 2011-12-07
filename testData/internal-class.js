define([],function(){var Foo=sp.Class.create("Foo",{constructor:function Foo(){Bar.baz()}});var Bar=sp.Class.create("Bar",{statics:{baz:function baz(){sp.trace("Hello, world!")}}});return Foo})

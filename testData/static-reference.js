var StaticTest=Class.create({methods:{foo:function foo(){StaticTest.bla=StaticTest.bar(StaticTest.baz);StaticTest.bla=StaticTest.bar(StaticTest.baz)}},statics:{bar:function bar(baz){return baz},baz:42,bla:null}})

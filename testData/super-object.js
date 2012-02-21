var MyClass=sp.Class.create("MyClass",{constructor:function MyClass(){Object.call(this)},prebound:{hasOwnProperty:function hasOwnProperty(){return sp.superOf(this).hasOwnProperty()}}})

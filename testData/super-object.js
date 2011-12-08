var MyClass=sp.Class.create("MyClass",{constructor:function MyClass(){sp.superOf(this).constructor()},prebound:{hasOwnProperty:function hasOwnProperty(){return sp.superOf(this).hasOwnProperty()}}})

var MyClass=sp.Class.create("MyClass",{constructor:function MyClass(){Object.call(this)},methods:{hasOwnProperty:function hasOwnProperty(){return Object.prototype.hasOwnProperty.call(this)}}})

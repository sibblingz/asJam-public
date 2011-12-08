var Super=sp.Class.create("Super",{constructor:function Super(){},properties:{prop:null}});var Sub=sp.Class.create("Sub",Super,{prebound:{foo:function foo(){var self=this;return self.prop}}})

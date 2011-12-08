var Super=sp.Class.create("Super",{properties:{superProperty:""}});var Sub=sp.Class.create("Sub",Super,{prebound:{subFunction:function subFunction(){var self=this;self.superProperty="omg"}}})

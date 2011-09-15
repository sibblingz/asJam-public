var Super=sp.Class.create("Super",{properties:{superProperty:""}});var Sub=sp.Class.create("Sub",Super,{methods:{subFunction:function subFunction(){var self=this;self.superProperty="omg"}}})

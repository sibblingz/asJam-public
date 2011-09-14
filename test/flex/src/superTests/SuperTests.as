package superTests {
	public class SuperTests {
		public function SuperTests() {
		}

		public static var testNames:Array = [
			'ctor',
			'childParentGrandparent'
		];

		public static function ctor():void {
			var c = new Subclass();

			Assert.equal(c.subclassCtorCalled, true, 'Subclass ctor called');
			Assert.equal(c.superclassCtorCalled, true, 'Superclass ctor called');
		}
		
		public static function childParentGrandparent():void {
			var g = new GrandParentClass("Hello");
			
			Assert.equal("GrandParentClass Hello", g.gstring);
			Assert.equal("GrandParentClass Hello", g.getGString());
			Assert.equal("GrandParentClass Hello override", g.getGStringOverride());
			
			var p = new ParentClass("Hello");
			
			Assert.equal("GrandParentClass Hello", p.gstring);
			Assert.equal("GrandParentClass Hello", p.getGString());
			Assert.equal("GrandParentClass Hello overriden by ParentClass Hello", p.getGStringOverride(),'overwridden method called');
			Assert.equal("ParentClass Hello", p.pstring);
			Assert.equal("ParentClass Hello", p.getPString());

			var c = new ChildClass("Hello");//no super
			
			Assert.equal(null, c.gstring);
			Assert.equal(null, c.getGString());
			Assert.equal("null overriden by null", c.getGStringOverride());
			Assert.equal(null, c.pstring);
			Assert.equal(null, c.getPString());
			Assert.equal("Hello", c.cstring);
			
			var c = new ChildClass(null);//no super
			
			Assert.equal("GrandParentClass null", c.gstring);
			Assert.equal("GrandParentClass null", c.getGString());
			Assert.equal("GrandParentClass null overriden by ParentClass null", c.getGStringOverride());
			Assert.equal("ParentClass null", c.pstring);
			Assert.equal("ParentClass null", c.getPString());
			Assert.equal("mc is not a String", c.cstring);

		}
	}
}

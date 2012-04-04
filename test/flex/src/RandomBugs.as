package {
	public class RandomBugs {
		public static var testNames:Array = [
			"test_instance_staticConst",
			"test_sp"
		];

		public static const staticConst = 42;
		protected var instance_staticConst = staticConst;
		public static function test_instance_staticConst():void {
			var obj = new RandomBugs();
			Assert.equal(42, obj.instance_staticConst);
		}

		public static function test_sp():void {
			var sp:String = "42";
			Assert.equal(42, int(sp));
		}

		/*
		public var instance_referenced = 42;
		public var instance_referencing = instance_referenced;
		public static function test_instance_referencing():void {
			var obj = new RandomBugs();
			Assert.equal(42, obj.instance_referencing);
			Assert.equal(42, obj.instance_referenced);
		}
		*/
	}
}

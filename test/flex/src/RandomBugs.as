package {
	public class RandomBugs {
		public static var testNames:Array = [
			"test_instance_staticConst"
		];

		public static const staticConst = 42;
		protected var instance_staticConst = staticConst;
		public static function test_instance_staticConst():void {
			var obj = new RandomBugs();
			Assert.equal(42, obj.instance_staticConst);
		}
	}
}

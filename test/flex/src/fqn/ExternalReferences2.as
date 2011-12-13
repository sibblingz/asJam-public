package fqn {
	import fqn.helpers.TestClass;

	public class ExternalReferences2 {
		public static var testNames:Array = [
			'instanceProperty'
		];
		
		public function ExternalReferences2() {
		    foo = 42;
		}

		public static function instanceProperty():void {
			var instance = new ExternalReferences2();
			Assert.equal(true, instance.testInstance.ok);
		}
		
		private var testInstance:fqn.helpers.TestClass = new fqn.helpers.TestClass();
		private var foo:int;
	}
}

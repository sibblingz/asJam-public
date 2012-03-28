package fqn {
	import fqn.helpers.TestClass;
	
	public class ExternalReferences {
		public static var testNames:Array = [
			'construct',
			'staticProperty'
		];
		
		public static function construct():void {
			var instance = new fqn.helpers.TestClass();
			Assert.equal(true, instance.ok);
		}
		
		public static function staticProperty():void {
			Assert.equal(true, staticInstance.ok);
		}
		
		private static var staticInstance = new fqn.helpers.TestClass();
	}
}
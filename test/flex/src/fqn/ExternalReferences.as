package fqn {
	public class ExternalReferences {
		public static var testNames:Array = [
			'construct'
		];
		
		public static function construct():void {
			var instance = new fqn.TestClass();
			Assert.equal(true, instance.ok);
		}
	}
}
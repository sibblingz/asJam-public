package fqn {
	public class SelfReferences {
		public static var testNames:Array = [
			'staticMethodCall'
		];

		public static function getTrue():Boolean {
			return true;
		}

		public static function staticMethodCall():void {
			Assert.equal(true, fqn.SelfReferences.getTrue());
		}
	}
}

package superTests {
	public class SuperTests {
		public function SuperTests() {
		}

		public static var testNames:Array = [
			'ctor'
		];

		public static function ctor():void {
			var c = new Subclass();

			Assert.equal(c.subclassCtorCalled, true, 'Subclass ctor called');
			Assert.equal(c.superclassCtorCalled, true, 'Superclass ctor called');
		}
	}
}

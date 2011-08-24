package {
	public class Assert {
		public function Assert() {
			throw new Error('Assert is a static class');
		}
		
		public static function expectedMessage( expected:*,actual:*):String {
			return 'expected: ' + expected + ' but got: ' + actual;
		}

		public static function equal(expected:*, actual:*, message:String = null):void {
			ok(expected == actual, message + " " + ('Equal: ' + expectedMessage(expected, actual)));
		}
		
		public static function same(expected:*, actual:*, message:String = null):void {
			ok(expected === actual, message + " " + ('Same: ' + expectedMessage(expected,actual)));
		}

		public static function arrayEqual( expected:Array,actual:Array, message:String = null):void {
			ok(!!actual, expectedMessage(expected, actual));

			if(actual.length !== expected.length)
				ok(false, expectedMessage('Array of length ' + actual.length, 'Array of length ' + expected.length));

			for(var i:Number = 0; i < expected.length; ++i) {
				equal(
					expected[i],
					actual[i],
					(message + " " + expectedMessage( expected[i], actual[i])) + ' (index ' + i + ')'
				);
			}
		}
		
		public static function ok(result:Boolean, message:String):void {
			if(!result)
				throw new AssertError(message);
		}
	}
}

class AssertError extends Error {
	public function AssertError(message:String) {
		super('Assertion failed: ' + (message || ''));
	}
}

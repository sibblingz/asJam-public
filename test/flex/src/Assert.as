package {
	public class Assert {
		public function Assert() {
			throw new Error('Assert is a static class');
		}
		
		public static function expectedMessage(actual:*, expected:*):String {
			return 'expected: ' + expected + ' but got: ' + actual;
		}

		public static function equal(actual:*, expected:*, message:String = null):void {
			ok(expected == actual, message || ('Equal: ' + expectedMessage(actual, expected)));
		}
		
		public static function same(actual:*, expected:*, message:String = null):void {
			ok(expected === actual, message || ('Same: ' + expectedMessage(actual, expected)));
		}

		public static function arrayEqual(actual:Array, expected:Array, message:String = null):void {
			ok(!!actual, expectedMessage(actual, expected));

			if(actual.length !== expected.length)
				ok(false, expectedMessage('Array of length ' + actual.length, 'Array of length ' + expected.length));

			for(var i:Number = 0; i < expected.length; ++i) {
				equal(
					actual[i],
					expected[i],
					(message || expectedMessage(actual[i], expected[i])) + ' (index ' + i + ')'
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

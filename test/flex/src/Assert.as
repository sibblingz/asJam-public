package {
	public class Assert {
		public function Assert() {
			throw new Error('Assert is a static class');
		}
		
		public static function expectedMessage(expected:*, actual:*):String {
			return 'expected: ' + expected + ' but got: ' + actual;
		}

		public static function equal(expected:*, actual:*, message:String = null):void {
			same(expected, actual, message);
			//ok(expected == actual, message + " " + ('Equal: ' + expectedMessage(expected, actual)));
		}
		
		public static function same(expected:*, actual:*, message:String = null):void {
			message = message + " Same: " + expectedMessage(expected, actual);

			if(typeof expected === 'number' && typeof actual === 'number' && isNaN(expected) && isNaN(actual)) {
				ok(true, message);
			} else {
				ok(expected === actual, message);
			}
		}

		public static function arrayEqual(expected:Array, actual:Array, message:String = null):void {
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
		message = 'Assertion failed: ' + (message || '');
		super(message);
		this.message = message;
	}

	private var message:String;

	public function toString():void {
		return this.message;
	}
}

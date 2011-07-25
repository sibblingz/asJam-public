package {
	public class Assert {
		public function Assert() {
			throw new Error('Assert is a static class');
		}
		
		public static function equal(expected:*, actual:*, message:String = null):void {
			ok(expected == actual, message || ('Equal: expected: ' + expected + ' but got: ' + actual));
		}
		
		public static function same(expected:*, actual:*, message:String = null):void {
			ok(expected === actual, message || ('Same: expected: ' + expected + ' but got: ' + actual));
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

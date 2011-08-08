package {
	public class DefaultArguments {
		public function DefaultArguments() {
		}

		public static var testNames:Array = [
			'testZeroZero',
			'testZeroOne',
			'testZeroTwo',
			'testZeroThree',

			/*
			'testOneZero',
			'testOneOne',
			'testOneTwo',
			'testOneThree',

			'testTwoZero',
			'testTwoOne',
			'testTwoTwo',
			'testTwoThree',

			'testThreeZero',
			'testThreeOne',
			'testThreeTwo',
			'testThreeThree'
			*/
		];

		public static function testZeroZero():void {
			var expected:Array = [ ];
			Assert.arrayEqual( expected,zero());
		}

		public static function testZeroOne():void {
			var expected:Array = [ 'one' ];
			Assert.arrayEqual( expected, one());
		}

		public static function testZeroTwo():void {
			var expected:Array = [ 'one', 2 ];
			Assert.arrayEqual( expected, two());
		}

		public static function testZeroThree():void {
			var expected:Array = [ 'one', 2, undefined ];
			Assert.arrayEqual(expected, three() );
		}

		private static function zero():Array {
			return [ ];
		}

		private static function one(one:String = 'one'):Array {
			return [ one ];
		}

		private static function two(one:String = 'one', two:Number = 2):Array {
			return [ one, two ];
		}

		private static function three(one:String = 'one', two:Number = 2, three:* = undefined):Array {
			return [ one, two, three ];
		}
	}
}

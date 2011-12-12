package {
	public class TypesTests {
		public static var testNames:Array = [
			'testIntDefault',
			'testIntNull',
			'testUintDefault',
			'testUintNull',
			'testNumberDefault',
			'testNumberNull',
			'testBooleanDefault',
			'testBooleanNull',
			'testStringDefault'
		];
		
		public static function testIntDefault():void {
			var v:int;
			Assert.equal(0, v);
		}

		public static function testIntNull():void {
			var v:int = null;
			Assert.equal(0, v);
		}

		public static function testUintDefault():void {
			var v:uint;
			Assert.equal(0, v);
		}

		public static function testUintNull():void {
			var v:uint = null;
			Assert.equal(0, v);
		}

		public static function testNumberDefault():void {
			var v:Number;
			Assert.equal(NaN, v);
		}

		public static function testNumberNull():void {
			var v:Number = null;
			Assert.equal(0, v);
		}

		public static function testBooleanDefault():void {
			var v:Boolean;
			Assert.equal(false, v);
		}

		public static function testBooleanNull():void {
			var v:Boolean = null;
			Assert.equal(false, v);
		}

		public static function testStringDefault():void {
			var v:String;
			Assert.equal(null, v);
		}
	}
}

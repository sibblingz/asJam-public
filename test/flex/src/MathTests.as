package {
	public class MathTests {
		public function MathTests() {
		}
		
		public static var testNames:Array = [
			'sum',
			'manySum',
			'difference',
			'manyDifference'
		];
		
		public static function sum():void {
			Assert.equal( 4, 2 +  2,  ' 2 +  2 =  4');
			Assert.equal( 0,-2 +  2,   '-2 +  2 =  0');
			Assert.equal( 0, 2 + -2,   ' 2 + -2 =  0');
			Assert.equal(-4,-2 + -2, '-2 + -2 = -4');
			Assert.equal( 7, 5 +  2, ' 5 +  2 =  7');
			Assert.equal( 7, 2 +  5,  ' 2 +  5 =  7');
		}
		
		public static function manySum():void {
			// TODO
		}
		
		public static function difference():void {
			// TODO
		}
		
		public static function manyDifference():void {
			// TODO
		}
	}
}
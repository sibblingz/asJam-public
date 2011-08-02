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
			Assert.equal( 7, 5 + 2, ' 5 + 2 =  7');
			Assert.equal( 7, 2 +  5,  ' 2 +  5 =  7');
		}
		
		public static function manySum():void {
			
			Assert.equal( 8, 2 +  2 + 2 + 2 ,  ' 2 +  2 + 2 + 2 =  8');
			Assert.equal( 0,-2 +  2 + 5 + -5,   '-2 +  2 + 5 + -5 =  0');
			Assert.equal( 0, 92 + 5 + -92 + -5 + 912347 + -912347,   ' 92 + 5 + -92 + -5 + 912347 + -912347 =  0');
			Assert.equal(-50,-2 + -2 + -7 + 7 + -45 + -1, '-2 + -2 = -4');
			Assert.equal( 119, 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2, ' (5 + 2) * 17 times = 119');
			Assert.equal( 119, 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5 + 2 + 5, ' (2 +  5) * 17 = 119');
		}
		
		public static function difference():void {
			
			Assert.equal( 0, 2 -  2,  ' 2 -  2 =  0');
			Assert.equal( -4,-2 -  2,   '-2 -  2 =  -4');
			Assert.equal( 4, 2 - -2,   ' 2 - -2=  4');
			Assert.equal( 0,-2 - -2, '-2 - -2 = 0');
			Assert.equal( 3, 5 - 2, ' 5 - 2 =  3');
			Assert.equal( -3, 2 - 5,  ' 2 -  5 =  3');
		}
		
		public static function manyDifference():void {
			
			Assert.equal( -8, -2 -  2 - 2 - 2 ,  ' 2 +  2 + 2 + 2 =  8');
			Assert.equal( 0, 2 - 2 + 5 - 5,   '-2 +  2 + 5 + -5 =  0');
			Assert.equal( 0, 92 - 5 - 92 - -5 + 912347 - 912347,   ' 92 + 5 + -92 + -5 + 912347 + -912347 =  0');
			Assert.equal(50, 2 - -2 - -7 - 7 - -45 - -1, '-2 + -2 = -4');
			Assert.equal( 51, 5 - 2 + 5 - 2 + 5 - 2 + 5- 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2 + 5 - 2, ' (5 - 2) * 17 times = 51');
			Assert.equal( -51, 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5 + 2 - 5, ' (2 -  5) * 17 = -51');
			
			
			Assert.equal( -115, 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5, ' (2 - (2*17) - (-5) * 17 = -115 ');
			Assert.equal( -119, -2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5 - 2 - 5, ' (2 -  5) * 17 = -119');

		}
		
		
		public static function manyDivide():void {
			
			Assert.equal( 1, 2 /  2,  ' 2 /  2 =  1');
			Assert.equal( -1,-2 /  2,   '-2 /  2 =  -1');
			Assert.equal( -1, 2 / -2,   ' 2 / -2=  -1');
			Assert.equal( 1,-2 / -2, '-2 / -2 = 1');
			Assert.equal( 2.5, 5 / 2, ' 5 / 2 =  2.5');
			Assert.equal( 0.4, 2 / 5,  ' 2 /  5 =  0.4');
			
			Assert.equal( 4, 512 /2/2 /2/2/2/2 /2, ' 512/2^7 = 4');
			Assert.equal( -4, 512 /-2/-2 /-2/-2/-2/-2 /-2, ' 512/(-2^7) = -4');
		}
		
		public static function manyMultiply():void {
			
			
			Assert.equal( 4, 2 *  2,  ' 2 *  2 =  4');
			Assert.equal( -4,-2 *  2,   '-2 *  2 =  -4');
			Assert.equal( -4, 2 * -2,   ' 2 * -2=  -4');
			Assert.equal( 4,-2 * -2, '-2 * -2 = 4');
			Assert.equal( 10, 5 * 2, ' 5 * 2 =  10');
			Assert.equal( 10, 2 * 5,  ' 2 *  5 =  10');
			
			Assert.equal( 512, 4 *2*2 *2*2*2*2 *2, ' 4*2^7 = 512');
			Assert.equal( -512, 4 *-2*-2 *-2*-2*-2*-2 *-2, ' 4*(-2^7) = -512 ');
			
			Assert.equal( -16, -2 *  2 * 2 * 2 ,  ' -2 *  2 * 2 * 2 =  16');
			Assert.equal( 100, 2 *- 2 * 5 *- 5,   '-2 +  2 + 5 + -5 =  0');
			
		}
		
		public static function manyPowerOf():void {
			
			Assert.equal( 4, 2 ^  2,  ' 2 *  2 =  4');
			Assert.equal( 4,-2 ^  2,   '-2 *  2 =  -4');
			Assert.equal( -1/4, 2 ^ -2,   ' 2 * -2=  1/4');
			Assert.equal( 1/4,-2 ^ -2, '-2 ^ -2 = 1/4');
			Assert.equal( 25, 5 ^ 2, ' 5 ^ 2 =  25');
			Assert.equal( 32, 2 ^ 5,  ' 2 ^  5 =  32');
			
			Assert.equal( 16, 2^2^2, ' 2^2^2 = 16');
			Assert.equal( -66, -4 ^3, ' 4^3 = -66 ');
						
		}
		
		public static function manyremainderOf():void {
			
			Assert.equal( 0, 2 %  2,  ' 2 %  2 =  0');
			Assert.equal( 0,-2 %  2,   '-2 %  2 =  0');
			Assert.equal( 0, 2 % -2,   ' 2 % -2=  0');
			Assert.equal( 0,-2 % -2, '-2 % -2 = 0');
			Assert.equal( 1, 5 % 2, ' 5 % 2 =  1');
			Assert.equal( 2, 2 % 5,  ' 2 %  5 =  2');
			
			Assert.equal( 0, 2%2%2, ' 2%2%2 = 0');
			Assert.equal( 1, -4 %3, ' -4%3 = 1');
			
		}

		public static function manyAll():void {
			
			Assert.equal( 4, 2+2-2*2/2%2^2, ' 2+2-2*2/2%2^2,');
			Assert.equal( -39, 1+2*3-4-(-5)+(6^1)%7*(-8)-(-9)^0,' 1+2*3-4--5+6^1%7*-8--9^0');

			
		}
		
		public static function manyPerenthesis():void {
			
			Assert.equal( 0, (2 %  2),  ' 2 %  2 =  0');
			Assert.equal( 0,(-2 %  2),   '-2 %  2 =  0');
			Assert.equal( 0, (2 % -2),   ' 2 % -2=  0');
			Assert.equal( 0,(-2 % -2), '-2 % -2 = 0');
			Assert.equal( 1, (5 % 2), ' 5 % 2 =  1');
			Assert.equal( 2, (2 % 5),  ' 2 %  5 =  2');
			
			
			Assert.equal( 0, ((2+2))-(((2*2^2)%2))/(2)+(-2)+(-2)-(-2)*(-2^2)%2/(-2), ' ((2+2))-((2*2^2)%2)/2+(-2)+(-2)-(-2)*(-2^2)%2/(-2) = 0');

			Assert.equal( 8, ((2+2))-(((2*2^2)%(2/2)))+(-2)+(-2)-(-2)*(-2^2)%2/(-2), ' ((2+2))-((2*2^2)%2)/2+(-2)+(-2)-(-2)*(-2^2)%2/(-2) = 0');			
			Assert.equal( 8,(((2+2))-(((2*2^2)%(2/2)))+(-2)+(-2)-(-2)*(-2^2)%2/(-2)), ' ((2+2))-((2*2^2)%2)/2+(-2)+(-2)-(-2)*(-2^2)%2/(-2) = 0');


		}
		

	}
}
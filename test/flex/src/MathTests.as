package {
	public class MathTests {
		public function MathTests() {
		}
		
		public static var testNames:Array = [
			'sum',
			'manySum',
			'difference',
			'manyDifference',
			'manyDivide',
			'manyMultiply',
			'manyModulo',
			'manyArithmatic',
			'manyOR',
			'manyXOR',
			'manyAND',
			'manyNOT',
			'manyLeftShift',
			'manyRightShift',
			'manyUnsignedRightShift',
			'bitwiseAssingment',
			'manyComments',
			'manyComparison',
			'manyLogical',
			'varOps'
			
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
		
		public static function manyModulo():void {
			
			Assert.equal( 0, 2 %  2,  ' 2 %  2 =  0');
			Assert.equal( 0,-2 %  2,   '-2 %  2 =  0');
			Assert.equal( 0, 2 % -2,   ' 2 % -2=  0');
			Assert.equal( 0,-2 % -2, '-2 % -2 = 0');
			Assert.equal( 1, 5 % 2, ' 5 % 2 =  1');
			Assert.equal( 2, 2 % 5,  ' 2 %  5 =  2');
			
			Assert.equal( 0, 2%2%2, ' 2%2%2 = 0');
			Assert.equal( -1, -4 %3);
			
		}

		public static function manyArithmatic():void {
			
			Assert.equal( 6, 2+2-2*2/2%2^2, ' 2+2-2*2/2%2^2,');
			Assert.equal( 17, 1+2*3-4-(-5)+(6^1)%7*(-8)-(-9),' 1+2*3-4--5+6^1%7*-8--9^0');

			
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
		
		public static function varOps():void {
			
			var b23: int;
			b23= 12;
			Assert.equal( 12, b23,  'b23 =  12');
			
			Assert.equal( 12,b23++,   'b23++ =  12');
			Assert.equal( 13,b23--,   'b23-- =  13');
			
			Assert.equal( 13,++b23,   '++b23 =  13');
			Assert.equal( 12,--b23,   '--b23 =  12');

			b23+= 12;
			Assert.equal( 24,b23,   'b23 +=12  24');
			b23-= 12;
			Assert.equal( 12,b23,   'b23 -=12 =  12');
			
			b23*= 12;
			Assert.equal( 144,b23,   'b23 *=12 =  144');
			
			b23/= 12;

			Assert.equal( 12,b23,   'b23 /=12 =  12');
			
			b23%= 11;
			Assert.equal( 1,b23,   'b23 %=11 =  1');
			
			b23=7;
			var b24: int = 9;
			Assert.equal( 1,b23&b24,   'b23&b24 =  1');

			
			Assert.equal( 1,b23&15&b24,   'b23&b24 =  1');

			Assert.equal( 1,b23&15&b24,   'b23&b24 =  1');

			Assert.equal( 15,b23|b24,   'b23|b24 =  15');
			
			Assert.equal( 11,8|3|1,   '8|3|1 =  1');
			
			Assert.equal( -9,~8,   '~8 =  7');
			Assert.equal( -8,~7,   '~7 =  8');
			Assert.equal( 8,~~8,   '~~8 =  8');
			Assert.equal( 8,~(~8/1),   '~~8 =  8');
			
			Assert.equal( 0, 8 ^ 8,   '8 ^ 8');
			Assert.equal( 15, 8 ^ 7,   '8 ^ 7');
			Assert.equal( 15, 8^ 7,   '8 ^ 7');
			Assert.equal( 15, 8 ^7,   '8 ^ 7');


		}
		
		public static function manyOR():void {
			Assert.equal( 31,23|24,   'b23|b24 =  15');
			
			Assert.equal( -5,-8|3|1,   '-8|3|1 =  1');
			
			Assert.equal( -3,8|-3|1,   '8|-3|1 =  1');
			
			Assert.equal( -1,8|3|-1,   '8|3|-1 =  1');
		
			Assert.equal( -1,8|-3|-1,   '8|-3|-1 =  1');

			Assert.equal( -1,-8|-3|-1,   '-8|-3|-1 =  1');
			
			Assert.equal( -1,-8|-3|-1 |14 |23|2,   '-8|-3|-1 |14 |23|2 =  -1');

			Assert.equal( -1,(-8)|(-3)| 14 |23|2,   '-8|-3| 14 |23|2 =  -1');


		}
		
		public static function manyXOR():void {
			
			Assert.equal( 0, 8 ^ 8,   '8 ^ 8');
			Assert.equal( 15, 8 ^ 7,   '8 ^ 7');
			Assert.equal( 15, 8^ 7,   '8 ^ 7');
			Assert.equal( 15, 8 ^7,   '8 ^ 7');
			
			
			Assert.equal( 6, 8 ^ 8 ^9^8^7,   '8 ^ 8 ^9^8^7');
			Assert.equal( 8, 7^8 ^ 7,   '7^8 ^ 7');
			Assert.equal( 76, 8^67^ 7,   '8^67^ 7');
			Assert.equal( 122, -8 ^117^-9,   '-8 ^117^-9');
			Assert.equal( -118, 8 ^117^-9,   '8 ^117^-9');
			Assert.equal( 116, 8 ^-117^(-9),   '8 ^-117^-9');
			Assert.equal( 126, 8 ^-117^(-9)/5^2,   '8 ^-117^(-9)/5^2');

		}
		
		public static function manyAND():void {
			Assert.equal( 8, 8 & 8,   '8 & 8');
			Assert.equal( 0, 8 & 7,   '8 & 7');
			Assert.equal( 0, 8& 7,   '8 & 7');
			Assert.equal( 0, 8 &7,   '8 & 7');
			
			
			Assert.equal( 0, 8 & 8 &9&8&7,   '8 & 8 &9&8&7');
			Assert.equal( 0, 7&8 & 7,   '7&8 & 7');
			Assert.equal( 0, 8&67& 7,   '8&67& 7');
			Assert.equal( 112, -8 &117&-9,   '-8 &117&-9');
			Assert.equal( 0, 8 &117&-9,   '8 &117&-9');
			Assert.equal( 0, 8 &-117&(-9),   '8 &-117&-9');
			Assert.equal( 0, 8 &-117&(-9)/5&2,   '8 &-117&(-9)/5&2');
			Assert.equal( 112, -8 &127&-9,   '-8 &117&-9');
			Assert.equal( 16, -8 &31&-9,   '-8 &117&-9');
			Assert.equal( 16, -8 &31&-9,   '-8 &117&-9');
			Assert.equal( -32, -8 &-31&-9,   '-8 &117&-9');

			
		}

		public static function manyNOT():void {
			Assert.equal( -9,~8,   '~8 =  7');
			Assert.equal( -8,~7,   '~7 =  8');
			Assert.equal( 8,~~8,   '~~8');
			Assert.equal( 8,~(~8/1),   '~(~8/1)');
			
			Assert.equal( -88,~87,   '~87');
			Assert.equal( 76,~-77,   '~-77');
			Assert.equal( -87,-~~87,   '-~~87');
			Assert.equal( 10,-~(~8/-1),   '-~(~8/-1)');
			
		}
		
		public static function manyLeftShift():void {
			
			Assert.equal( 2048, 8 << 8,   '8 << 8');
			Assert.equal( 1024, 8 << 7,   '8 << 7');
			Assert.equal( 1024, 8<< 7,   '8 << 7');
			Assert.equal( 1024, 8 <<7,   '8 << 7');
			
			
			Assert.equal( 0, 8 << 8 <<9<<8<<7,   '8 << 8 <<9<<8<<7');
			Assert.equal( 229376, 7<<8 << 7,   '7<<8 << 7');
			Assert.equal( 8192, 8<<67<< 7,   '8<<67<< 7');
			Assert.equal( 0, -8 <<117<<-9,   '-8 <<117<<-9');
			Assert.equal( 0, 8 <<117<<-9,   '8 <<117<<-9');
			Assert.equal( 0, 8 <<-117<<(-9),   '8 <<-117<<-9');
			Assert.equal( 0, 8 <<-117<<(-9)/5<<2,   '8 <<-117<<(-9)/5<<2');
			Assert.equal( 0, -8 <<127<<-9,   '-8 <<117<<-9');
			Assert.equal( 0, -8 <<31<<-9,   '-8 <<117<<-9');
			Assert.equal( 0, -8 <<31,   '-8 <<117<<-9');
			Assert.equal( -16, -8 <<-31,   '-8 <<117<<-9');
			
		}
		
		public static function manyRightShift():void {
			
			Assert.equal( 0, 8 >> 8,   '8 >> 8');
			Assert.equal( 2, 8 >> 2,   '8 >> 2');
			Assert.equal( 2, 8>> 2,   '8>> 2');
			Assert.equal( 2, 8 >>2,   '8 >>2');
			Assert.equal( 8, 8 >>0,   '8 >> 0');

			
			Assert.equal( 0, 8 >> 8 >>9>>8>>7,   '8 >> 8 >>9>>8>>7');
			Assert.equal( 0, 7>>8 >> 7,   '7>>8 >> 7');
			Assert.equal( 0, 8>>67>> 7,   '8>>67>> 7');
			Assert.equal( -1, -8 >>117>>-9,   '-8 >>117>>-9');
			Assert.equal( 0, 8 >>117>>-9,   '8 >>117>>-9');
			Assert.equal( 0, 8 >>-117>>(-9),   '8 >>-117>>-9');
			Assert.equal( 0, 8 >>-117>>(-9)/5>>2,   '8 >>-117>>(-9)/5>>2');
			Assert.equal( -1, -8 >>127>>-9,   '-8 >>127>>-9');
			Assert.equal( -1, -8 >>31>>-9,   '-8 >>31>>-9');
			Assert.equal( -1, -8 >>31,   '-8 >>31');
			Assert.equal( -4444, -8888 >>-31,   '-8888 >>117>>-9');

			Assert.equal( 7, 229376>>8 >> 7,   '7>>8 >> 7');

		}
		
		public static function manyUnsignedRightShift():void {
			Assert.equal( 0, 8 >>> 8,   '8 >>> 8');
			Assert.equal( 2, 8 >>> 2,   '8 >>> 2');
			Assert.equal( 2, 8>>> 2,   '8 >>> 2');
			Assert.equal( 2, 8 >>>2,   '8 >>> 2');
			Assert.equal( 8, 8 >>>0,   '8 >>> 0');

			
			Assert.equal( 0, 8 >>> 8 >>>9>>>8>>>7,   '8 >>> 8 >>>9>>>8>>>7');
			Assert.equal( 0, 7>>>8 >>> 7,   '7>>>8 >>> 7');
			Assert.equal( 0, 8>>>67>>> 7,   '8>>>67>>> 7');
			Assert.equal( 0, -8 >>>117>>>-9,   '-8 >>>117>>>-9');
			Assert.equal( 0, 8 >>>117>>>-9,   '8 >>>117>>>-9');
			Assert.equal( 0, 8 >>>-117>>>(-9),   '8 >>>-117>>>-9');
			Assert.equal( 0, 8 >>>-117>>>(-9)/5>>>2,   '8 >>>-117>>>(-9)/5>>>2');
			Assert.equal( 0, -8 >>>127>>>-9,   '-8 >>>127>>>-9');
			Assert.equal( 0, -8 >>>31>>>-9,   '-8 >>>31>>>-9');
			Assert.equal( 1, -8 >>>31,   '-8 >>>31');
			Assert.equal( 2147479204, -8888 >>>-31,   '-8888 >>>117>>>-9');
			
			Assert.equal( 7, 229376>>>8 >>> 7,   '7>>>8 >>> 7');
			
		}
		
		public static function bitwiseAssingment():void {
			
			
			var x=23;
			x|=24
			Assert.equal( 31,x,   '23|=24 =  15');
			
			x=-8;
			x|=3;
			x|=1;
			Assert.equal( -5,x,   '-8|=3|=1 =  1');
			
			x=8;
			x|=-3;
			x|=1;
			Assert.equal( -3,x,   '8|=-3|=1 =  1');
			x|=8;
			x|=3;
			x|=-1;
			Assert.equal( -1,x,   '8|=3|=-1 =  1');
			x|=8;x|=-3;x|=-1;
			Assert.equal( -1, x,   '8|-3|-1 =  1');
			x|=-8;x|=-3|1;x|=-1;
			Assert.equal( -1,x,   '-8|-3|-1 =  1');
			x|=-8;x|=-3;x|=-1 ;x|=14 ;x|=23;x|=2;
			Assert.equal( -1,x,   '-8;x|=-3;x|=-1 ;x|=14 ;x|=23;x|=2 =  -1');
			x=(-8)|(-3)| 14 |23|2;
			Assert.equal( -1,x,   '-8|-3| 14 |23|2 =  -1');

			Assert.equal( 0, 8 ^ 8,   '8 ^ 8');
			Assert.equal( 15, 8 ^ 7,   '8 ^ 7');
			Assert.equal( 15, 8^ 7,   '8 ^ 7');
			Assert.equal( 15, 8 ^7,   '8 ^ 7');
			
			
			Assert.equal( 6, 8 ^ 8 ^9^8^7,   '8 ^ 8 ^9^8^7');
			Assert.equal( 8, 7^8 ^ 7,   '7^8 ^ 7');
			Assert.equal( 76, 8^67^ 7,   '8^67^ 7');
			Assert.equal( 122, -8 ^117^-9,   '-8 ^117^-9');
			Assert.equal( -118, 8 ^117^-9,   '8 ^117^-9');
			Assert.equal( 116, 8 ^-117^(-9),   '8 ^-117^-9');
			Assert.equal( 126, 8 ^-117^(-9)/5^2,   '8 ^-117^(-9)/5^2');
			
			Assert.equal( 8, 8 & 8,   '8 & 8');
			Assert.equal( 0, 8 & 7,   '8 & 7');
			Assert.equal( 0, 8& 7,   '8 & 7');
			Assert.equal( 0, 8 &7,   '8 & 7');
			
			
			Assert.equal( 0, 8 & 8 &9&8&7,   '8 & 8 &9&8&7');
			Assert.equal( 0, 7&8 & 7,   '7&8 & 7');
			Assert.equal( 0, 8&67& 7,   '8&67& 7');
			Assert.equal( 112, -8 &117&-9,   '-8 &117&-9');
			Assert.equal( 0, 8 &117&-9,   '8 &117&-9');
			Assert.equal( 0, 8 &-117&(-9),   '8 &-117&-9');
			Assert.equal( 0, 8 &-117&(-9)/5&2,   '8 &-117&(-9)/5&2');
			Assert.equal( 112, -8 &127&-9,   '-8 &117&-9');
			Assert.equal( 16, -8 &31&-9,   '-8 &117&-9');
			Assert.equal( 16, -8 &31&-9,   '-8 &117&-9');
			Assert.equal( -32, -8 &-31&-9,   '-8 &117&-9');

			
		}
		
		public static function manyComments():void {
			//`1234567890-=~!@#$%%%%^^&*()_+qwrety	qwrweqtyuiop[]\QWERTYUIOP{}|ASFGHJKL:"""asdhgfjkl;;;'ZXCVBBNM<>?zxcvbbnm,./789456321/-*+.
			Assert.equal( 1, 1,   '1 is 1'); //wow no way?
			Assert.equal( 1, 1,   '1 is 1'); //wow no way?
			Assert.equal( 1, 1,   '1 is 1'); //wow no way?
			Assert.equal( 1, 1,   '1 is 1'); //wow no way?
			Assert.equal( 1, 1,   '1 is 1'); //wow no way?
			

			//wow no way?			Assert.equal( 1, 1,   '1 is 1'); 
			/*this is an assert*/Assert.equal( 1, 1,   '1 is 1'); //dadasdadaf
			/*sadfsd
			sdafsda
			fsd
			af
			sda
			fsad
			gsggasg
			sad
			g
			dsf
			dsa
			fadsf//
			//sdf*/
			
			Assert.equal( 1, 1/* ,  '1 is 1' terrible style*/); //wow no way?
			Assert.equal( 1, 1/* ,  '1 is 1' terrible style*/); //wow no way?
			Assert.equal( 1, 1/* ,  '1 is 1' terrible style*/); //wow no way?
			Assert.equal( /* ,  '1 is 1' terrible style*/1,/* ,  '1 is 1' terrible style*/ 1/* ,  '1 is 1' terrible style*/); //wow no way?

			Assert.equal( 1,
				1,
				//wtf?
				'1 is 1'); //wow no way?
			
			Assert.equal( 1,
				1,
				//wtf?
				/*this is crazy this works wow?
				*///classy
				'1 is 1'); //wow no way?
			
			
			Assert.equal( 1,
				//wtf?
				/*this is crazy this works wow?
				*///classy
				1,
				//"wierd this is cool
				'1 is 1'); //wow no way?
		}
		
		public static function manyComparison():void {
			
		}
		public static function manyLogical():void {
			
			
		}
	}
}
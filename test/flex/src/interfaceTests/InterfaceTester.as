package interfaceTests
{
	public class InterfaceTester
	{
		public function InterfaceTester()
		{
		}
		
		public static var testNames:Array = [
			'testShot',
			'testGetShot'
			
		];
		
		public static function testShot():void {
			
			var iTest:InterfaceTest= new InterfaceTest();
			if(iTest.getCanShoot())
				iTest.getShot(30);
			Assert.equal(iTest.getCanShoot(),true);
			Assert.equal(iTest.numChildren,0);
		}
		
		public static function testGetShot():void {
			
			var iTest= new InterfaceTest();

			Assert.equal( 4, 2 +  2,  ' 2 +  2 =  4');
			Assert.equal( 0,-2 +  2,   '-2 +  2 =  0');
			Assert.equal( 0, 2 + -2,   ' 2 + -2 =  0');
			Assert.equal(-4,-2 + -2, '-2 + -2 = -4');
			Assert.equal( 7, 5 + 2, ' 5 + 2 =  7');
			Assert.equal( 7, 2 +  5,  ' 2 +  5 =  7');
		}
	}
}
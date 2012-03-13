package cycles.inheritance
{
	public class SubClass1 extends BaseClass
	{
		public function SubClass1()
		{
			super();
		}
		
		override public function foo():String{
			return "sub class 1";
		}
		
		public static function whosYourChild():String
		{
			return "no one";
		}
		
		public static var testNames:Array = [
			'test'
		];
		
		public static function test():void{
			var sub:SubClass1 = new SubClass1();
			Assert.equal( BaseClass.whosYourChild(), "no one" );
			Assert.equal( sub.bar(), "this is not overridden" );
			Assert.equal( sub.foo(), "sub class 1" );
		}
	}
}
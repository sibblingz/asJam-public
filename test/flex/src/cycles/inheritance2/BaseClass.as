package cycles.inheritance2
{
	public class BaseClass
	{
		public function BaseClass()
		{
		}
		
		public function foo():String{
			return "base class";
		}
		
		public function bar():String{
			return "this is not overridden";
		}
		
		public static function whosYourChild():String
		{
			return SubClass2.whosYourChild();
		}
		
		public static var testNames:Array = [
			'test'
		];
		
		public static function test():void{
			var sub:SubClass2 = new SubClass2();
			Assert.equal( BaseClass.whosYourChild(), "no one" );
			Assert.equal( sub.bar(), "this is not overridden" );
			Assert.equal( sub.foo(), "sub class 2" );
		}
	}
}

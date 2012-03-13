package cycles.inheritance
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
			return SubClass1.whosYourChild();
		}
	}
}
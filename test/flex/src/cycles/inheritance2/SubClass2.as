package cycles.inheritance2
{
	public class SubClass2 extends BaseClass
	{
		public function SubClass2()
		{
			super();
		}
		
		override public function foo():String{
			return "sub class 2";
		}
		
		public static function whosYourChild():String
		{
			return "no one";
		}
	}
}

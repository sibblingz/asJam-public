package cycles.large
{
	public class Four
	{
		public function Four()
		{
		}
		
		public static function number():int{
			return 4;
		}
		
		public static var testNames:Array = [
			'test'
		];
		
		public static function test():void{
			Assert.equal( 5, Five.number() );
		}
	}
}
package cycles.large
{
	public class Five
	{
		public function Five()
		{
		}
		
		public static function number():int{
			return 5;
		}
		
		public static var testNames:Array = [
			'test'
		];
		
		public static function test():void{
			Assert.equal( 1, One.number() );
		}
	}
}
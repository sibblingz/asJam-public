package cycles.large
{
	public class Two
	{
		public function Two()
		{
		}
		
		public static function number():int{
			return 2;
		}
		
		public static function test():void{
			Assert.equal( 1, One.number() );
		}
	}
}
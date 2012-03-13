package cycles.large
{
	public class One
	{
		public function One()
		{
		}
		
		public static function number():int{
			return 1;
		}
		
		public static var testNames:Array = [
			'test'
		];
		
		public static function test():void{
			Assert.equal( 2, Two.number() );
			Assert.equal( 3, Three.number() );
		}
	}
}
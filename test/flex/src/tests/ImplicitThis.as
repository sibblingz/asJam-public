package tests
{
	public class ImplicitThis
	{
		public function ImplicitThis()
		{
			
		}
		
		public static var testNames:Array = [
			'methodology'//,
			//'manySum',
			//'difference',
			//'manyDifference'
		];
		
		public static function methodology(){
			var bob = new ImplicitThis();
			bob.fred();
		}
		
		public function fred(){
			Assert.equal(billybob(),true,"bob is BILLY BOB");
		}
		
		public function billybob(){
			return true;
		}
		
		
	}
}
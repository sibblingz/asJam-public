package static_references
{
	import flash.display.MovieClip;

	public class OtherUnrelatedClass
	{
		public static var testNames:Array = [
			'test1'
		];	
		
		public function OtherUnrelatedClass(){}
		
		public static function test1()
		{
			StaticReference.backgroundArtwork = MovieClip;
			
			var staticReference = new StaticReference();
			
			Assert.ok(true, "I am still alive");
		}
	}
}
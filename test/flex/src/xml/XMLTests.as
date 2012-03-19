package xml
{
	public class XMLTests
	{
		public static var testInput:String = '<test p="dude" q="8" w="0.846" x="your mom"><hork></hork><hork></hork><hork></hork><hork></hork><bork></bork><bork></bork><widget></widget></test>';

		public static var testNames:Array = [
			'testProperties'
		];
		
		public static function testProperties():Boolean {
			var parsed:XML = XML(testInput);
			
			var list:XMLList;
			var obj:*;
			
			
			list = parsed.@p;
			Assert.isType( XMLList, list );
			Assert.equal( list.length(), 1 );
			obj = list[0];
			Assert.isType( XML, obj );
			Assert.equal( "dude", obj.toString() );
			
			
			list = parsed.@q;
			Assert.isType( XMLList, list );
			Assert.equal( list.length(), 1 );
			obj = list[0];
			Assert.isType( XML, obj );
			Assert.equal( "8", obj.toString() );
			
			
			list = parsed.@w;
			Assert.isType( XMLList, list );
			Assert.equal( list.length(), 1 );
			obj = list[0];
			Assert.isType( XML, obj );
			Assert.equal( "0.846", obj.toString() );
			
			
			list = parsed.@x;
			Assert.isType( XMLList, list );
			Assert.equal( list.length(), 1 );
			obj = list[0];
			Assert.isType( XML, obj );
			Assert.equal( "your mom", obj.toString() );
			
			return true;
		}
		
		public function XMLTests()
		{
			

		}
	}
}
package xml
{
	public class XMLTests
	{
		public static var testInput:String = '<test p="dude" q="8" w="0.846" x="your mom"><hork></hork><hork></hork><hork></hork><hork></hork><bork></bork><bork></bork><widget></widget></test>';

		public static var deeplyNestedTestInput:String = '<root><a><c><h><leaf/></h></c><d><leaf/></d><leaf/></a><b><e><leaf/></e><f><i><leaf/></i></f><g></g></b></root>';
		
		public static var testNames:Array = [
			'testProperties',
			'testChildren',
			'testIteration'
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
		
		public static function testChildren():Boolean{
			var parsed:XML = XML(testInput);
			
			var children:* = parsed.children();
			var child:*;
			
			Assert.isType( XMLList, children );
			Assert.equal( 7, children.length() );
			child = children[0];
			Assert.isType( XML, child );
			Assert.equal( "<hork/>", child.toXMLString() );
			
			children = parsed.hork;
			Assert.isType( XMLList, children );
			Assert.equal( 4, children.length() );
			
			children = parsed.bork;
			Assert.isType( XMLList, children );
			Assert.equal( 2, children.length() );
			
			children = parsed.widget;
			Assert.isType( XMLList, children );
			Assert.equal( 1, children.length() );
			
			trace("alive");
			return true;
		}
		
		public static function testIteration():Boolean{
			var parsed:XML = XML(testInput);
			var counter:int = 0;
			
			for each( var child:* in parsed.hork ){
				Assert.isType( XML, child );
				Assert.equal( "<hork/>", child.toXMLString() );
				counter += 1;
			}
			Assert.equal( 4, counter );
			
			
			counter = 0;
			for(var j:int = 0; j < parsed.children().length(); j++)
			{
				var child:XML = parsed.children()[j];
				counter += 1;
			}
			Assert.equal( 7, counter );
			
			
			parsed = XML( deeplyNestedTestInput );
			counter = 0;
			for each( var child:* in parsed..leaf ){
				Assert.isType( XML, child );
				Assert.equal( "<leaf/>", child.toXMLString() );
				counter += 1;
			}
			Assert.equal( 5, counter );
			
			
			
			return true;
		}
		
		public function XMLTests()
		{
			

		}
	}
}
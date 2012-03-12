package cycles
{
	public class SimpleCycle1
	{
		private var other:SimpleCycle2;
		public var id:int;
		
		public static var testNames:Array = [
			'test'
		];
		
		public function SimpleCycle1()
		{
			this.other = new SimpleCycle2();
			this.id = 1;
		}
		
		public static function test(){
			
			var test:SimpleCycle1 = new SimpleCycle1();
			Assert.equal(test.id, 1);
			
			var other:SimpleCycle2 = test.other;
			Assert.equal(other.id, 2);
		}
	}
}
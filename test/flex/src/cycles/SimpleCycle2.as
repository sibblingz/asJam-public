package cycles
{
	public class SimpleCycle2
	{
		private var _other:SimpleCycle1;
		public var id:int;
		
		public function SimpleCycle2()
		{
			this.id = 2;
		}
		
		public function makeInstance():void{
			this._other = new SimpleCycle1();
		}
		
		public function get other():SimpleCycle1{
			return this._other;
		}
	}
}
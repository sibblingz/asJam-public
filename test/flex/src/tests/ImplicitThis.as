package tests
{
	public dynamic class ImplicitThis
	{
		private var i = 0;

		public function ImplicitThis()
		{
			
		}
		
		public static var testNames:Array = [
			'method',
			'changeLocalVar',
			'callObjectHasOwnProperty'//,
			//'difference',
			//'manyDifference'
		];
		
		public static function method(){
			var bob = new ImplicitThis();
			bob.fred();
		}
		
		public static function changeLocalVar(){
			var bar = new ImplicitThis();
			bar.changeValue();
				
		}
		
		public static function callObjectHasOwnProperty() {
			var x = new ImplicitThis();
			x.callObjectHasOwnProperty();
		}
		
		public function callObjectHasOwnProperty() {
			this.hello = 'world';
			Assert.equal(true, hasOwnProperty('hello'));
		}
		
		public function fred(){
			Assert.equal(true,billybob(),"bob is BILLY BOB");
			Assert.equal(true,billyjoe(true),"bob is BILLY JOE");
			Assert.equal(false,billyjoe(false),"bob is NOT BILLY JOE");
		}
		
		public function changeValue(){
			addVal(12);
			Assert.equal(12,this.i,"i = 12");
			
			addVal(24);
			Assert.equal(36,this.i,"i = 36");
			
			this.addVal(-36);
			
			Assert.equal(0,this.i," i = 0");
		}
		
		public function addVal(value:int):void{
			i = i + value;
		}
		
		public function billybob(){
			return true;
		}

		public function billyjoe(val:Boolean){
			return val;
		}
		
	}
}
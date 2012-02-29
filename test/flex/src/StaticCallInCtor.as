package {
	public class StaticCallInCtor {
		public static var testNames:Array = [
			'check'
		];

		public function StaticCallInCtor() {
			staticFunction();
		}

		public static function staticFunction():void {
			staticVar = true;
		}

		public static function check():void {
			new StaticCallInCtor();
			Assert.equal(true, staticVar);
		}

		public static var staticVar:Boolean = false;
	}
}

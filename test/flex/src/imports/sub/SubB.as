package imports.sub {
	public class SubB {
		public static var message:String = 'world';

		public function SubB() {
			new SubC();
		}

		public function world():String {
			return message;
		}
	}
}

package imports.sub {
	import imports.sub.*;

	class SubB {
		public static var message:String = 'world';

		public function SubB() {
			new SubC();
		}

		public function world():String {
			return message;
		}
	}
}

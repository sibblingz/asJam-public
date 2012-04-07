package imports {
	import imports.sub.*;

	public class Importer {
		public static var testNames:Array = [
			'test'
		];

		public static function test():void {
			var b = new SubB();
			Assert.equal('world', b.world());
		}
	}
}

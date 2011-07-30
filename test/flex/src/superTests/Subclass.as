package superTests {
	public class Subclass extends Superclass {
		public var subclassCtorCalled:Boolean = false;

		public function Subclass() {
			this.subclassCtorCalled = true;

			Assert.equal(this.superclassCtorCalled, false, 'Superclass ctor not called');
			super();
			Assert.equal(this.superclassCtorCalled, true, 'Superclass ctor called after super');
		}
	}
}

package {
    [RemoteClass]
    [Event(name="click", type="flash.events.Event")]
    class Foobar {
        [Deprecated]
        public function foo() {
        }

        [IconFile("la")]
        public var ico = "asdf";

        [Inspectable()]
        public function get bla():int {
            return 42;
        }
    }
}

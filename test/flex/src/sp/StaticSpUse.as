package sp {
    import flash.utils.getTimer;

    public class StaticSpUse {
        public static var myGetTimer:* = getTimer;

        public static var testNames:Array = [
            "testGetTimer"
        ];

        public static function testGetTimer():void {
            Assert.equal(getTimer, myGetTimer);
            Assert.equal("function", typeof myGetTimer);
        }
    }
}

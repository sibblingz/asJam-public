package cycles {
    import cycles.B;

    class A {
        public static var testNames:Array = [
            'test'
        ];

        public static function test():void {
            Assert.equal("B", B.name);
        }
    }
}

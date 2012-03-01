package cycles {
    import cycles.A;

    class C {
        public static var testNames:Array = [
            'test'
        ];

        public static function test():void {
            Assert.equal("A", A.name);
        }
    }
}

package cycles {
    import cycles.CycleA;

    class C {
        public static var testNames:Array = [
            'test'
        ];

        public static function test():void {
            Assert.equal("A", CycleA.stupidFunctionName());
        }
		
		public static function stupidFunctionName():String {
			return "B";
		}
    }
}

package cycles {
    import cycles.B;

    class CycleA {
        public static var testNames:Array = [
            'test'
        ];

        public static function test():void {
            Assert.equal("B", B.stupidFunctionName());
        }
		
		public static function stupidFunctionName():String {
			return "B";
		}
    }
}

package {
	import defaultParameters.DefaultParamTests;
	
	import fqn.ExternalReferences;
	import fqn.ExternalReferences2;
	import fqn.SelfReferences;
	
	import interfaceTests.InterfaceTester;
	
	import superTests.SuperTests;
	
	import tests.ImplicitThis;

	import cycles.A;
	import cycles.B;
	import cycles.C;

	public class Main {
		public function Main() {
		}
		
		public static var testSuiteClasses = [
			MathTests,
			DefaultArguments,
			TypesTests,
			//SuperTests,
			ImplicitThis,
			DefaultParamTests,
			InterfaceTester,
			SelfReferences,
			ExternalReferences,
			ExternalReferences2,
			StaticCallInCtor,
			A, B, C,
			JSONTests
		];
		
		public static function run():void {
			testAll();
		}
		
		public static function testAll():void {
			for each(var suite:* in testSuiteClasses) {
				testSuite(suite);
			}
		}
		
		public static function testSuite(suite:*):void {
			var suiteName:String = /^\[class (.*)\]$/.exec(suite.toString())[1];
			
			for each(var testName:String in suite.testNames) {
				trace('Testing ' + suiteName + '::' + testName + '...');
				suite[testName]();
			}
		}
	}
}

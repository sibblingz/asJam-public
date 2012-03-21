package {
	/*
	import cycles.CycleA;
	import cycles.B;
	import cycles.C;
	*/
	import cycles.SimpleCycle1;
	import cycles.inheritance.SubClass1;
	import cycles.large.Five;
	import cycles.large.Four;
	import cycles.large.One;
	import cycles.large.Three;
	import cycles.large.Two;
	
	import defaultParameters.DefaultParamTests;
	
	import fqn.ExternalReferences;
	import fqn.ExternalReferences2;
	import fqn.SelfReferences;
	
	import interfaceTests.InterfaceTester;
	
	import sp.StaticSpUse;

	import superTests.SuperTests;
	
	import tests.ImplicitThis;
	
	import xml.XMLTests;

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
			//CycleA, B, C,
			SimpleCycle1,
			SubClass1,
			One, Two, Three, Four, Five,
			RandomBugs,
			JSONTests,
			StaticSpUse,
			XMLTests
		];
		
		public static function run():void {
			testAll();
			trace("ALL TESTS PASS");
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

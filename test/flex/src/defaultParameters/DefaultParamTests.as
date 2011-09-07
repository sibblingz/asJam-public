package defaultParameters
{
	import DifferentPackage.NewTests;

	public class DefaultParamTests
	{
		public function DefaultParamTests()
		{
		}
		
		public static var testNames:Array = [
			'testDefault',
			'testOptional'
		];	
		
		public static function testDefault():void{
			Assert.equal( 123.5,retDefaultArgs());
			Assert.equal( 123.5,retDefaultArgs(123.5));
			Assert.equal( "str",retDefaultArgs("str"));
			Assert.equal( "str",retDefaultArgsB("str"));
			Assert.equal( 123124,retDefaultArgsB(123124));
			Assert.equal( null,retDefaultArgsB());

			Assert.equal( -7,defaultArgsMany());
			Assert.equal( 0,defaultArgsMany(null,null,null,null,123,12));
			Assert.equal( null,defaultArgsMany(null,null,null,null,123,12,null,null,null));
			Assert.equal( 0,defaultArgsMany(new NewTests(),2,null,null,123,12,0,null,null));
			Assert.equal( 0,defaultArgsMany(new NewTests(),2,null,null,123,12,null,null,"NaN"));
			Assert.equal( "a string",defaultArgsMany(new NewTests(),2,null,null,123,12,"a string",null,false));
			Assert.equal( "a different string",defaultArgsMany(new NewTests(),2,null,null,123,12,"a different string",null,false));
			
			Assert.equal( "a string",defaultArgsManyB());
			Assert.equal( "a string",defaultArgsManyB(null,null,null,null,123,12));
			Assert.equal( null,defaultArgsManyB(null,null,null,null,123,12,null,null));
			Assert.equal( 0,defaultArgsManyB(new NewTests(),2,null,null,123,12,0,null));
			Assert.equal( 0,defaultArgsManyB(new NewTests(),2,null,null,123,12,null,null));
			Assert.equal( "a string",defaultArgsManyB(new NewTests(),false,null,null,123,12,"a string",null));
			Assert.equal( "a different string",defaultArgsManyB(new NewTests(),false,null,null,123,12,"a different string",null));
			Assert.equal( 0,defaultArgsManyB(null,true,null,null,123,12));

				
			Assert.equal( 123.5,defaultFunction());
			Assert.equal( 123.5,defaultFunction(retDefaultArgs));
			Assert.equal( 123.5,defaultFunction(retDefaultArgs));
			Assert.equal( null,defaultFunction(retDefaultArgsB));

		}
		
		public static function testOptional():void{

			Assert.equal(1,sum(1),'sum(1) = 1');
			Assert.equal(0,sum(0),'sum(0) = 0');
			Assert.equal(0,sum(1,-1),'sum(1,-1) = 0');
			Assert.equal(36,sum(0,1,2,3,4,5,6,7,8,9,-9,0),'sum(0,1,2,3,4,5,6,7,8,9,-9,0) = 36');

			Assert.equal(38,sum(0,1.5,2.5,3,4,5,6.5,7.5,8,9,-9,0),'sum(0,1.5,2.5,3,4,5,6.5,7.5,8,9,-9,0) = 38');
			Assert.equal(36,sum(0,1.5,2.5,3,4,5,6.5,7.5,8,9,-9.75,-1.25),'sum(0,1.5,2.5,3,4,5,6.5,7.5,8,9,-9.75,-1.25) = 36');

		}
		
		public static function defaultFunction(functionArgument:Function = null) {
			if (functionArgument != null) {
				 return functionArgument();
			} else {
				return retDefaultArgs();
			}
		}
		
		public static function retDefaultArgs( a = 123.5 ) {
			return a;
		}
		
		public static function retDefaultArgsB( a = null ) {
			return a;
		}
		
		public static function defaultArgsMany( mov:NewTests = null,a1 = null,a2 = null,a3 = null,a4:int = 0,a5 =5,a6 = "a string",a8='c',a9=true ) {
			var z=12;
			//if default
			if(a9) 
      			return a5-z;
			else{
				return a6;
			}
		}
		
		public static function defaultArgsManyB( mov:NewTests = null,a1 = false,a2 = null,a3 = null,a4:int = 0,a5 =5,a6 = "a string",a8='c' ):Object {
			var z=12;
			//if default
			if(a1) 
				return a5-z;
			else{
				return a6;
			}
		}
		
		public static function sum(required:Number, ... optionalArgs):Number {
			var total:Number =required;
			
			for each (var value:Number in optionalArgs)
				total+=value;
			return total
		}
	}
}
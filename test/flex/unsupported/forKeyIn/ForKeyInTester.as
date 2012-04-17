package forKeyIn
{
	public class ForKeyInTester
	{
		public function ForKeyInTester()
		{
			
		}

		public static var testNames:Array = [
			'testOnlyStringsSimple',
			'testOnlyNumbers'
		];	
		
		public static function testAbstractAllOrders(keysValues:Array, correctOutput, numOrders):void{
			for( var i = 0; i < numOrders; i++ ){
				var randomOrdering:Array = [];
				var temp:Array = keysValues.concat();
				while( temp.length > 0 ){
					var randomIndex:int = Math.floor(Math.random()*temp.length);
					var randomPair = temp.splice(randomIndex,1)[0];
					randomOrdering.push( randomPair );
				}
				
				trace( "random ordering nummmmber: " + i );
				trace( "keys values: " + JSON.stringify(randomOrdering) );
				testAbstract( randomOrdering, correctOutput );
			}
		}
		
		public static function testAbstract(keysValues:Array, correctOutput):void{
			var obj:Object = new Object();
			
			for( var i:int = 0; i < keysValues.length; i++ ){
				var pair:* = keysValues[i];
				obj[pair[0]] = pair[1];
			}
			
			var output:Array = [];
			for( var key:* in obj ){
				output.push( [key, obj[key]] );
			}
			
			Assert.equal( output.length, correctOutput.length );
			if( output.length < 1000 ){
				trace( JSON.stringify(output) );
			}
			for( var i:int = 0; i < correctOutput.length; i++ ){
				Assert.equal( correctOutput[i][0], output[i][0] );
				Assert.equal( correctOutput[i][1], output[i][1] );
			}
		}
		
		public static function testOnlyNumbers():void{
			var arr:Array = [1,2,3,4,5];
			trace( arr[8] );
			
			testAbstract(
				[[1,1], [2,2], [3,3]],
				[[1,1], [2,2], [3,3]]
			);
			
			testAbstract(
				[[2,1], [1,2], [3,3]],
				[[1,2], [2,1], [3,3]]
			);
			
			testAbstract(
				[[2,1], [1,2], [3,3], [8,4], [45,5], [6,6], [7,7], [99,8], [4,9]],
				[[1,2],[2,1],[3,3],[4,9],[6,6],[7,7],[8,4],[99,8],[45,5]]
			);
			
			/*
			This cannot be made to pass
			
			testAbstractAllOrders(
				[[5,1], [8,2], [16,3], [27,4], [7,5], [26,6], [56,7], [18,8], [4,9], [1,10], [25,11]],
				//[[8,2],[1,10],[18,8],[4,9],[5,1],[16,3],[7,5],[56,7],[25,11],[26,6],[27,4]],
				//[[16,3],[1,10],[18,8],[56,7],[4,9],[5,1],[7,5],[8,2],[25,11],[26,6],[27,4]],
				//[[16,3],[1,10],[18,8],[8,2],[4,9],[5,1],[7,5],[56,7],[25,11],[26,6],[27,4]],
				[[56,7],[1,10],[18,8],[27,4],[4,9],[5,1],[7,5],[8,2],[25,11],[26,6],[16,3]],
				10
			);
			*/
			
			// Actual data from AGT
			testAbstract(
				[[12293,true],[12289,true],[12291,true],[12303,true],[12294,true],[12288,true],[12290,true],[12304,true],[12298,true],[12292,true],[12296,true],[12305,true],[12302,true],[12300,true],[12301,true],[12307,true],[12312,true],[12313,true],[12314,true],[12315,true]],
				[[12288,true],[12289,true],[12290,true],[12291,true],[12292,true],[12293,true],[12294,true],[12296,true],[12298,true],[12300,true],[12301,true],[12302,true],[12303,true],[12304,true],[12305,true],[12307,true],[12312,true],[12313,true],[12314,true],[12315,true]]
			);
			
			testAbstract(
				[[293,true],[12289,true],[12291,true],[12303,true],[12294,true],[12288,true],[12290,true],[12304,true],[12298,true],[12292,true],[12296,true],[12305,true],[12302,true],[12300,true],[12301,true],[12307,true],[12312,true],[12313,true],[12314,true],[12315,true]],
				[[12288,true],[12289,true],[12290,true],[12291,true],[12292,true],[293,true],[12294,true],[12296,true],[12298,true],[12300,true],[12301,true],[12302,true],[12303,true],[12304,true],[12305,true],[12307,true],[12312,true],[12313,true],[12314,true],[12315,true]]
			);
			
			testAbstract(
				[[1,true],[100,true],[10000,true],[1000,true],[100000,true],[1000000,true]],
				[[10000,true],[1,true],[1000000,true],[1000,true],[100,true],[100000,true]]
			);
			
			testAbstract(
				[[1,true],[122,true],[10003,true],[1004,true],[100005,true],[1000006,true]],
				[[1,true],[122,true],[10003,true],[1004,true],[100005,true],[1000006,true]]
			);
			
			testAbstract(
				[[161,true],[122,true],[10083,true],[1064,true],[1000225,true],[1000046,true]],
				[[1064,true],[161,true],[122,true],[10083,true],[1000225,true],[1000046,true]]
			);
			
			var oneToAMillion:Array = (new Array(100000)).map( function(_, i){ return i; } ).map( function(x){ return [x,true]; } );
			
			testAbstract(
				oneToAMillion,
				oneToAMillion
			);
			
			var oneToAMillionReversed:Array = (new Array(100000)).map( function(_, i){ return 99999-i; } ).map( function(x){ return [x,true]; } );
			
			testAbstract(
				oneToAMillionReversed,
				oneToAMillion
			);
			
			var someLargeNumbers:Array = [[1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [1000,10], [1001,11], [1002,12], [1003,13], [1004,14], [1005,15], [1006,16], [1007,17], [1008,18], [1009,19]];
			
			testAbstract(
				someLargeNumbers,
				[[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[1000,10],[9,9],[1002,12],[1003,13],[1004,14],[1005,15],[1006,16],[1007,17],[8,8],[1001,11],[1008,18],[1009,19]]
			);
			
			trace("wow... passed...");
		}
		
		public static function testOnlyStringsSimple():void{
			testAbstract(
				[['a',1], ['b',2], ['c',3]],
				[["c",3],["b",2],["a",1]]
			);
			
			testAbstract(
				[['b',1], ['c',2], ['a',3]],
				[["c",2],["b",1],["a",3]]
			);
			
			testAbstract(
				[['!',1], ['&',2], ['9',3], ['a',4], ['A',5]],
				[[9,3],["A",5],["&",2],["!",1],["a",4]]
			);
			
			testAbstract(
				[['a',1], ['&',2], ['9',3], ['!',4], ['A',5]],
				[[9,3],["A",5],["&",2],["a",1],["!",4]]
			);
			
			testAbstract(
				[['a',1], ['b',2], ['c',3], ['d',4], ['e',5], ['f',6], ['g',7], ['h',8], ['i',9], ['j',10], ['k',11]],
				[["j",10],["e",5],["k",11],["f",6],["a",1],["g",7],["b",2],["h",8],["c",3],["i",9],["d",4]]
			);
			
			testAbstract(
				[['i',1], ['k',2], ['j',3], ['d',4], ['e',5], ['f',6], ['a',7], ['h',8], ['g',9], ['c',10], ['b',11]],
				[["j",3],["e",5],["k",2],["f",6],["a",7],["g",9],["b",11],["h",8],["c",10],["i",1],["d",4]]
			);
			
			/*
			Provides inconsistent results...  The order changes on each run.
			This test passed at least once... but failed on other runs.
			
			testAbstract(
				[['y',1], ['k',2], ['j',3], ['d',4], ['e',5], ['f',6], ['aaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbcccccccccccccccccccccccccccccccccdddddddddddddddddddddddddddddddddddddddddddeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeefffffffffffffffffffffffffffffffffffggggggggggggggggggggggggggggggggggggggghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiiiiiiiiiiiiiiiijjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkllllllllllllllllllllllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnooooooooooooooooooooooooooooooooppppppppppppppppppppppppppppppp',7], ['h',8], ['g',9], ['c',10], ['b',11]],
				[["j",3],["e",5],["k",2],["f",6],["y",1],["g",9],["aaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbcccccccccccccccccccccccccccccccccdddddddddddddddddddddddddddddddddddddddddddeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeefffffffffffffffffffffffffffffffffffggggggggggggggggggggggggggggggggggggggghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiiiiiiiiiiiiiiiijjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkllllllllllllllllllllllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnooooooooooooooooooooooooooooooooppppppppppppppppppppppppppppppp",7],["b",11],["h",8],["c",10],["d",4]]
			);
			*/
		}
	}
}
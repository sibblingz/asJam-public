var INPUT = {
	"a":["b","c","d"],
	"b":["c","d"],
	"c":[],
	"d":["c"],
	"e":["f","g","h"],
	"f":["h"],
	"g":["e"],
	"h":[],
	"i":["j","k","l"],
	"j":["k","l"],
	"k":["i","l"],
	"l":["i"],
	"m":[],
	"n":["o"],
	"o":[],
	"p":["q"],
	"q":["p"]
};

function tarjan( graph ){
	var index = 0;
	var set = [];
	var sccs = [];
	
	function strongconnect(v){
		indexDictionary[v] = index;
		lowLinkDictionary[v] = index;
		index = index + 1;
		set.push( v );
		
		graph[v].forEach( function(w){
			if( indexDictionary[w] === undefined ){
				strongconnect(w);
				lowLinkDictionary[v] = Math.min(lowLinkDictionary[v], lowLinkDictionary[w]);
			}else if( set.indexOf(w) !== -1 ){
				lowLinkDictionary[v] = Math.min(lowLinkDictionary[v], indexDictionary[w]);
			}
		});
		
		if( lowLinkDictionary[v] === indexDictionary[v] ){
			var stronglyConnectedComponent = [];
			sccs.push( stronglyConnectedComponent );
			do{
				var w = set.pop();
				stronglyConnectedComponent.push( w );
			}while( v !== w );
			return stronglyConnectedComponent;
		}
	}

	var indexDictionary = {};
	var lowLinkDictionary = {};

	for( var v in graph ){
		if( indexDictionary[v] === undefined ){
			strongconnect(v);
		}
	}
	console.log( sccs );
}

tarjan( INPUT );
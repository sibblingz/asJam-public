function findFlat(graph) {
    var index = 0;
    var set = [];
    var sccs = [];

    function strongconnect(v) {
        indexDictionary[v] = index;
        lowLinkDictionary[v] = index;
        index = index + 1;
        set.push(v);

        graph[v].forEach(function(w) {
            if(typeof indexDictionary[w] === 'undefined') {
                strongconnect(w);
                lowLinkDictionary[v] = Math.min(lowLinkDictionary[v], lowLinkDictionary[w]);
            } else if(set.indexOf(w) !== -1) {
                lowLinkDictionary[v] = Math.min(lowLinkDictionary[v], indexDictionary[w]);
            }
        });

        if(lowLinkDictionary[v] === indexDictionary[v]) {
            var stronglyConnectedComponent = [];
            sccs.push(stronglyConnectedComponent);
            do {
                var w = set.pop();
                stronglyConnectedComponent.push(w);
            } while (v !== w);
            return stronglyConnectedComponent;
        }
    }

    var indexDictionary = Object.create(null);
    var lowLinkDictionary = Object.create(null);

    for(var v in graph) {
        if(typeof indexDictionary[v] === 'undefined') {
            strongconnect(v);
        }
    }

    return sccs;
}

exports.findFlat = findFlat;

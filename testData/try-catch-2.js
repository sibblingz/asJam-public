try{var json=new JSON();var o=json.parse(this.data.data)}catch(err){handleError("Failed handling network, json decoding error, error = "+err.toString()+", data = "+this.data.data)}

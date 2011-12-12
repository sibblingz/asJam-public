try
{
        var json:JSON = new JSON();
        var o:Object=json.parse(this.data.data);
} catch (err) {
        handleError("Failed handling network, json decoding error, error = " + err.toString() + ", data = " + this.data.data);
}


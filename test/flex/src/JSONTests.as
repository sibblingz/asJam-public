package {
	import com.adobe.serialization.json.JSON;
	import com.adobe.serialization.json.JSONDecoder;
	import com.adobe.serialization.json.JSONEncoder;

	public class JSONTests {
		public static var testNames:Array = [
			'jsonEncodeStatic',
			'jsonDecodeStatic'
		];

		public static function jsonEncodeStatic() {
			Assert.equal('{"hello":"world"}', JSON.encode({ hello: 'world' }));
		}

		public static function jsonDecodeStatic() {
			var obj = JSON.decode('{"hello":"world"}');
			Assert.equal('world', obj.hello);
		}

		public static function jsonEncodeInstance() {
			var encoder:JSONEncoder = new JSONEncoder({ hello: 'world' });
			Assert.equal(true, encoder is JSONEncoder);
			Assert.equal('{"hello":"world"}', encoder.getString());
		}

		public static function jsonDecodeInstance() {
			var decoder:JSONDecoder = new JSONDecoder('{"hello":"world"}', true);
			Assert.equal(true, decoder is JSONDecoder);

			var obj = decoder.getValue();
			Assert.equal('world', obj.hello);
		}
	}
}

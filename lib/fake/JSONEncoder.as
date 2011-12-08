package com.adobe.serialization.json {
    public class JSONEncoder {
        private var jsonString:String;

        public function JSONEncoder(value:*) {
            var GLOBAL = (function () { return this; }());

            jsonString = GLOBAL.JSON.stringify(value);
        }

        public function getString():String {
            return jsonString;
        }
    }
}

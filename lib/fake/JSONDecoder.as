package com.adobe.serialization.json {
    public class JSONDecoder {
        private var value:*;

        public function JSONDecoder(s:String, strict:Boolean) {
            if (!strict) {
                throw new Error("Only strict JSON is supported");
            }

            var GLOBAL = (function () { return this; }());

            try {
                value = GLOBAL.JSON.parse(s);
            } catch (e:SyntaxError) {
                throw new JSONParseError(e.message);
            }
        }

        public function getValue():* {
            return value;
        }
    }
}

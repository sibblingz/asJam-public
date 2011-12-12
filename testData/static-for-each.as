class Foobar {
    public function foo() {
        for each (var x in myStatic) {
            return x;
        }
    }

    public static var myStatic = [ 1, 2, 3 ];
}

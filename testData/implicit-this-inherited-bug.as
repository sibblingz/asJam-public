public class Super {
    public function Super():void {
    }

    public var prop;
}

public class Sub extends Super {
    public function foo():Object {
        return prop;
    }
}

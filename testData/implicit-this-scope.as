class Foobar {
    public function one(self) {
        two();
        return self;
    }

    public function two() {
    }

    public function self() {
    }
}

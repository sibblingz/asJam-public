try {
        throw new Error();
} catch (e:Error) {
        baz();
}

try {
        throw new Error();
} catch (e:TypeError) {
        foo();
} catch (e:Error) {
        bar();
}

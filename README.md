# asJam, a jam of ActionScript

asJam converts ActionScript 3 source code into [Spaceport][1]-compatible
JavaScript source code.

asJam is copyright (c) 2011-2012 spaceport.io, Inc.; see LICENSE for details.

[1]: http://spaceport.io/

## Setting up

Binary dependencies:

* Node.JS 0.4.x, 0.6.x

To install:

    npm install

To test:

    npm test
    # or
    make test

## About

The converter does *not* completely convert source code.  Some manual work will
be required to complete a port of an ActionScript 3 game to Spaceport.  The
conversion tool is designed to relieve developers of performing the many
mundane tasks involved in porting a project to a different language, including:

* Converting AS3 packages into [Spaceport modules][2].
* Converting AS3 classes into [Spaceport classes][3].
* Removing type annotations.
* Inserting ``this.`` in front of member variable and property references.
* Inserting ``sp.`` in front of Spaceport classes.

Again, **do not expect automatically-converted code to work** without
modification.  Developers *will* need to test, debug, and modify converted code
manually.

[2]: http://docs.spaceport.io/3.2/en/tutorials/js/modules.html
[3]: http://docs.spaceport.io/3.2/en/tutorials/js/class.html

## Supported features

* Classes

  * Static properties and constants
  * Static methods
  * Member properties and constants  
    Note: If you call `super` in a constructor explicitly, properties of
    superclasses will not be assigned until `super` is called.

  * Member functions
     * Implicit `this.` (via a `self` alias)
     * `super`

  * Constructors
     * `super`
     * Implicit `super`

  * Getter and setter functions
     * `super`

  * Dynamic classes
  * Visibility (`private`, `protected`, `public`)
  * Internal package classes

* Functions

  * Optional arguments
  * Rest (`...rest`) arguments
  * `arguments` array

* Packages

  * `import com.co`
  * `import com.*`
  * Implicit imports from same package and global package
  * Importing a `flash` package
  * Partial support for fully-qualified names

* Binary operators

  * `+`, `-`, `*`, `/`, `%`
  * `=`, `+=`, `-=`, `*=`, `/=`, `%=`
  * `<<`, `>>`, `>>>`, `&`, `|`, `^`
  * `<<=`, `>>=`, `>>>=`, `&=`, `|=`, `^=`
  * `==`, `!=`, `===`, `!==`
  * `>`, `<`, `>=`, `<=`
  * `&&`, `||`
  * `&&=`, `||=`
  * `in`, `instanceof`, `is`, `as`
  * Array access
  * Comma operator
  * Dot access
  * Type operator (`:`)

* Unary operators

  * `+`, `-`
  * `++`, `--`
  * `~`, `!`
  * `new`, `delete`
  * `typeof`, `void`

* Ternary operators

  * `?:`

* Flow control

  * `if`, `for`, `while`, `do-while`
  * `for-in`, `for-each`
  * `with`
  * `try-catch-finally`
  * `function`

* Literals

  * Number literals (`0.9992`, `1.42e20`, `NaN`, `Infinity`, `-Infinity`)
  * String literals (`"a\nb"`)
  * Array literals (`[ a, b ]`)
  * Object literals (`{ a: b }`)
  * Boolean literals (`true`, `false`)
  * RegExp literals (`/regexp/gi`)
  * `null`

* Global types

  * `*` type
  * `Number`, `String`, `Array`, `Object`, `Boolean`
  * `Date`, `RegExp`

* Other features

  * `Vector.<>`
  * Comments (`//` and `/* */`)
  * `trace`
  * Casting

* Specific conversions

  * Use of `flash.system.Security` is removed (with a warning).
  * `com.adobe.serialization.JSON` and friends are replaced with classes
    using the native JavaScript (and Flash 11+) `JSON` class.

## Unsupported features

Using the following features may result in non-working code or may not allow a
project to be converted at all.  In other words, **the conversion may be
unsuccessful**.

The following features **will cause a crash** and will *not* convert at all:

* XML classes and syntax

  * `::`, `{}`, `[]`, `+`, `+=`, `@`, `..`, `.`, `<>`

* Proxy classes (`flash.utils.Proxy`)
* Internal package classes
* Package function exports
* Static constructors

The following features **may produce improperly-functioning code** and will
likely require manual modifications:

* Namespaces
* `flash.utils.Dictionary`
* Interfaces
* `int`, `uint`; all numbers are treated as floating-point numbers except
  upon declaration
* `Class` class
* Metadata tags (e.g. `[Embed]`)
* `flash.utils`, unless otherwise specified
* Naming conflicts requiring fully-qualified names

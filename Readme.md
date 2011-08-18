# Mocket

Mocking library for [nodejs](http://nodejs.org)

## Features

  - simple and lightweight
  - no need to import/instantiate constructors or objects for the mocks
  - expect many, n, at least n, at most n calls
  - allow/ignore calls
  - flexible argument matching: explicit values, by type, match function
  - define return values directly, by function, or delegate

## Installation

  $ npm install mocket
  
## License

(MIT License)

Copyright (c) 2011 David Harvey <@teamsandtechnology.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Usage - basic

Require mocket, create a context:

```javascript
   var mocket = require('mocket');
   var context = new mocket.Mocket();
```
Create a mock:

```javascript
   var mock = context.createMock();
```

Set up expectations (note chaining of expectations):

```javascript
  mock.expects("func").passing("hello", context.ANYTHING).atLeast(2).returning("goodbye");
```

Call the mock:

```javascript
  mock.func("hello", 42);
```

Check the expectations - boolean:

```javascript
  var OK = context.verifyMocks();
```

... or assert (throws assert.AssertionError):

```javascript
  context.assertMocks();
```

## Usage - number of calls

Call at least once is default:

```javascript
  mock.expects("func");
  context.verifyMocks(); // false
  
  mock.func();
  context.verifyMocks(); // true
  
  mock.func();
  context.verifyMocks(); // true
```

Call a specific number of times:

```javascript
  mock.expects("func").times(3);
  context.verifyMocks(); // false
  
  mock.func();
  context.verifyMocks(); // false
  
  mock.func();
  mock.func();
  context.verifyMocks(); // true

  mock.func();
  context.verifyMocks(); // false
```

Call at least/at most n times:

```javascript
  mock1.expects("func").atLeast(3);
  mock2.expects("func").atMost(7);
  mock3.expects("func").atLeast(2).atMost(4);
```

Expect never to be called:

```javascript
  mock.expects("func").never();
  context.verifyMocks(); // true

  mock.func();
  context.verifyMocks(); // false
```

Ignore all calls to named function:

```javascript
  mock.allows("func");
  context.verifyMocks(); // true

  mock.func();
  context.verifyMocks(); // trues
```

## Usage - argument matching

Match literal arguments:

```javascript
  mock.expects("func").passing("hello", 1);
  mock.func("hello", 1);
  context.verifyMocks(); // true

  mock.func("goodbye", 2);
  context.verifyMocks(); // false
```

Match any arguments:

```javascript
  mock.expects("func").passing(context.ANYARGS);
  mock.func("hello", 1);
  context.verifyMocks(); // true

  mock.func();
  mock.func([1,2,3]);
  mock.func("goodbye", 2);
  context.verifyMocks(); // true
```

Match any argument in a given position:

```javascript
  mock.expects("func").passing("hello", context.ANYTHING);
  mock.func("hello", 1);
  context.verifyMocks(); // true

  mock.func("hello", [2,3,4]);
  context.verifyMocks(); // true

  mock.func("goodbye", [2,3,4]);
  context.verifyMocks(); // false
```

Match an argument of a given type (type string as returned by _typeof_ operator):

```javascript
  mock.expects("func").passing(context.any('number'));
  mock.func(1);
  mock.func(3.1412);
  context.verifyMocks(); // true

  mock.func("whoops");
  context.verifyMocks(); // false
```

Match an argument with a given constructor:

```javascript
  function Foo() {}
  function Bar() {}

  mock.expects("func").passing(context.any(Foo));

  mock.func(new Foo());
  context.verifyMocks(); // true

  mock.func(new Bar());
  context.verifyMocks(); // false
```

Match an argument with a function:

```javascript
  mock.expects("func").passing(function(a) {return a === 1 || a === 2});
  mock.func(1);
  context.verifyMocks(); // true

  mock.func(3);
  context.verifyMocks(); // false
```

## Usage - returning values, throwing exceptions:

Return same value for every call:

```javascript
  mock.expects("func").returning(123);
  var ret = mock.func(); // ret === 123
```

Return values depending on parameter expectation:

```javascript
  mock.expects("func").passing("hello").returning(123);
  mock.expects("func").passing("goodbye").returning(456);
  var ret1 = mock.func("hello");   // ret1 === 123
  var ret2 = mock.func("goodbye"); // ret2 === 456
```

Throw an instance of Error:

```javascript
  mock.expects("func").throwing();
  mock.func();   // throws new Error()
```

Throw an instance of custom exception:

```javascript
  function MyException() {}
  mock.expects("func").throwing(MyException);
  mock.func();   // throws new MyException()
```

Throw a preconstructed instance of custom exception:

```javascript
  function MyException(message) {
    this.message = message;
    this.name = "MyException";
  }
  mock.expects("func").throwing(new MyException("from mock"));
  mock.func();   // throws passed object as exception
```

## Usage - stubbing, delegating:

Return values via a stubbed function:

```javascript
  mock.expects("func").passing(context.any('number').as(function (n) {return n * 2});
  var ret1 = mock.func(10);   // ret1 === 20
  var ret2 = mock.func(7.5);  // ret2 === 15
```

Return values via a delegate:

```javascript
  var delegate = {
    func1 : function(n) { return n * 2 },
    func2 : function(s) { return s + ", indeed!" }
  };

  mock.expects("func1").passing(context.any('number').as(delegate);
  mock.expects("func2").passing(context.any('string').as(delegate);
  var ret1 = mock.func1(10);    // ret1 === 20
  var ret2 = mock.func2("hey"); // ret2 === "hey indeed!"
```



   

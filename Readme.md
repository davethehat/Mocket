# Mocket

Mocking library for [nodejs](http://nodejs.org)

## Features

  - simple and lightweight
  - no need to import/instantiate code for the objects being mocked
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

   var mocket = require('mocket');
   var context = new mocket.Mocket();
   
Create a mock:

   var mock = context.createMock();

Set up expectations:

  mock.expects("func");
  
Call the mock:

  mock.func();
  
Check the expectations - boolean:

  var OK = context.verifyMocks();
  
... or assert (throws assert.AssertionError):

  context.assertMocks();

## Usage - number of calls

Call at least once is default:

  mock.expects("func");
  context.verifyMocks(); // false
  
  mock.func();
  context.verifyMocks(); // true
  
  mock.func();
  context.verifyMocks(); // true

Call a specific number of times:

  mock.expects("func").times(3);
  context.verifyMocks(); // false
  
  mock.func();
  context.verifyMocks(); // false
  
  mock.func();
  mock.func();
  context.verifyMocks(); // true

  mock.func();
  context.verifyMocks(); // false

Call at least/at most n times:

  mock1.expects("func").atLeast(3);
  mock2.expects("func").atMost(7);
  mock3.expects("func").atLeast(2).atMost(4);
  
Assert that never called:

  mock.expects("func").never();

Ignore all calls to named function:

  mock.allows("func");




   

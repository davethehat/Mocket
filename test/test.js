/*
MOCKET - simple but comprehensive mock objects for JavaScript

Copyright (c) 2011 David Harvey

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
*/

"use strict";

var assert = require("assert");
var Mocket = require("../mocket.js");
var equals = Mocket.equals;

function newContext() {
  return Mocket.Mocket();
}

function verifyMocksOK(mocket) {
  assert.ok(mocket.verifyMocks());
  assert.doesNotThrow(function() {mocket.assertMocks()}, assert.AssertionError);
}

module.exports.testObjectEquals = function() {
  assert.ok(equals({},{}));
  assert.ok(equals({a: 1},{a: 1}));
  assert.ok(equals({a:1, b:2}, {b:2, a:1}));
  assert.ok(equals({f: true},{f:true}));
  assert.ok(equals({r: /abc/},{r: /abc/}));

  assert.ok(!equals({a:1, b:2, c:3}, {b:2, a:1}));
  assert.ok(!equals({a:1, b:2}, {b:2, a:1, c:3}));
  assert.ok(!equals({f:true},{f:false}));
  assert.ok(!equals({r: /abc/},{r: /abcd/}));
}

module.exports.testArrayEquals = function() {
  assert.ok(equals([],[]));
  assert.ok(equals([1,2,3],[1,2,3]));
  assert.ok(equals([1,2,[3,"IV", "five"]],[1,2,[3,"IV", "five"]]));

  assert.ok(!equals([],""));
  assert.ok(!equals([1],[1,2]));
  assert.ok(!equals([ 1, 'two', [ 'III' ] ],[ 1, 2, [ 'three' ] ]));
  assert.ok(!equals([ 1, 'two', [ 'III', [ 4 ] ] ],[ 1, 'two', [ 'III', ['IV'] ] ]));
};

function verifyMocksNotOK(mocket) {
  assert.ok(!mocket.verifyMocks());
  assert.throws(function() {mocket.assertMocks()}, Mocket.MockAssertionError);
}

module.exports.testCallMany = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func");

  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksOK(mocket);
  
  m.func();
  verifyMocksOK(mocket);
};

module.exports.testCallOnce = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").once();

  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);
};

module.exports.testCallN = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").times(3);

  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);
};

module.exports.testAtLeast = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").atLeast(3);

  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);

  m.func();
  verifyMocksOK(mocket);

  m.func();
  verifyMocksOK(mocket);
};

module.exports.testAtMost = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").atMost(3);

  verifyMocksOK(mocket);

  m.func();
  verifyMocksOK(mocket);

  m.func();
  verifyMocksOK(mocket);

  m.func();
  verifyMocksOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);
};

module.exports.testCallNever = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").never();

  verifyMocksOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);
};

module.exports.testAllowsNotCalled = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.allows("allowed");

  m.allowed();
  m.allowed();
  verifyMocksOK(mocket);
};

module.exports.testAllowsNotCalled = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.allows("allowed");
  verifyMocksOK(mocket);
};

module.exports.testWithArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", 1);

  m.func("hello", 1);
  verifyMocksOK(mocket);

  m.func("goodbye");
  verifyMocksNotOK(mocket);
};

module.exports.testWithArrayArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", [1,2,["three"]]);

  m.func("hello", [1,2,["three"]]);
  verifyMocksOK(mocket);

  m.func();
  verifyMocksNotOK(mocket);
};

module.exports.testWithObjectArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  var d1 = new Date();
  var d2 = new Date(d1);
  m.expects("func").passing({a: 1, b: "two", c: [1,2,3], d: d1});

  m.func({a: 1, b: "two", c: [1,2,3], d: d2});
  verifyMocksOK(mocket);
}

module.exports.testFailsWithArrayArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", [1,"two",["III"]]);

  m.func("hello", [1,"two",["III"]]);
  verifyMocksOK(mocket);

  m.func("hello", [1,2,["three"]]);
  verifyMocksNotOK(mocket);
};

module.exports.testDifferentArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", 1).once();
  m.expects("func").passing("goodbye", 2).once();

  m.func("hello", 1);
  verifyMocksNotOK(mocket);

  m.func("goodbye", 2);
  verifyMocksOK(mocket);
};

module.exports.testReturn = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").once().returning("gotcha");

  var ret = m.func();
  assert.equal("gotcha", ret);
  verifyMocksOK(mocket);
};

module.exports.testDifferentReturns = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").returning("gotcha","again");

  var ret = m.func();
  assert.equal("gotcha", ret);
  ret = m.func();
  assert.equal("again", ret);
  ret = m.func();
  assert.equal("again", ret);
  
  verifyMocksOK(mocket);
};

module.exports.testReturnDifferentArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", 1).once().returning("first");
  m.expects("func").passing("goodbye", 2).once().returning("second");

  var ret1 = m.func("hello", 1);
  assert.equal("first", ret1);

  var ret2 = m.func("goodbye", 2);
  assert.equal("second", ret2);
  verifyMocksOK(mocket);
};

module.exports.testStub = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  var called = false;
  m.expects("func").once().as(function() {
    called = true;
    return "Called!";
  });

  var ret = m.func();
  assert.ok(called);
  assert.equal("Called!", ret);
  verifyMocksOK(mocket);
};

module.exports.testStubObject = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  var stub = {
    called: false,
    func: function() {
      this.called = true;
      return "Called!";
    }
  };
  m.expects("func").once().as(stub);

  var ret = m.func();
  assert.ok(stub.called);
  assert.equal("Called!", ret);
  verifyMocksOK(mocket);
};

module.exports.testAnyArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing(mocket.ANYARGS).times(3);

  m.func();
  m.func("A string");
  m.func("Lots", "of", -1, ["loverly", "args"]);
  verifyMocksOK(mocket);
};

module.exports.testAnythingArg = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", mocket.ANYTHING);

  m.func("hello", 123);
  verifyMocksOK(mocket);

  m.func("hello", [1,2,3]);
  verifyMocksOK(mocket);

  m.func("goodbye", [1,2,3]);
  verifyMocksNotOK(mocket);
};

module.exports.testInstanceOfNumberArg = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", mocket.any('number'));

  m.func("hello", 123);
  verifyMocksOK(mocket);

  m.func("hello", [1,2,3]);
  verifyMocksNotOK(mocket);
};

module.exports.testInstanceOfCustomObjectArg = function() {
  function Foo() {};
  function Bar() {};
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", mocket.any(Foo));

  m.func("hello", new Foo());
  verifyMocksOK(mocket);

  m.func("hello", new Bar());
  verifyMocksNotOK(mocket);
};

module.exports.testInstanceMatcherArg = function() {
  function Foo() {};
  function Bar() {};
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", function(a) {return a === 1 || a === 2});

  m.func("hello", 1);
  m.func("hello", 2);
  verifyMocksOK(mocket);

  m.func("hello", 3);
  verifyMocksNotOK(mocket);
};

module.exports.testThrowsError = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").throwing();
  assert.throws(
    function() { m.func(); },
    Error
  );
  verifyMocksOK(mocket);
}

module.exports.testThrowsCustomError = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  function MyEx() {
    this.name = "MyEx";
  }
  m.expects("func").throwing(MyEx);
  assert.throws(
    function() { m.func(); },
    MyEx
  );
  verifyMocksOK(mocket);
}

module.exports.testThrowsCustomErrorObject = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  function MyEx() {
    this.name = "MyEx";
  }
  m.expects("func").throwing(new MyEx());
  assert.throws(
    function() { m.func(); },
    MyEx
  );
  verifyMocksOK(mocket);
}

module.exports.testObjectMatcher = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("foo").passing({one : 1, two : "II", $three : [1,2,3], four : {a : "AAA"}});
  m.foo({one : 1, two : "II", $three : [1,2,3], four : {a : "AAA"}});
  verifyMocksOK(mocket);
}
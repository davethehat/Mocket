var assert = require("assert");

function newContext() {
  return require("../mocket.js").Mocket();
}

module.exports.testCallMany = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func");
  assert.ok(!mocket.verifyMocks());
  m.func();
  assert.ok(mocket.verifyMocks());
  m.func();
  assert.ok(mocket.verifyMocks());
}

module.exports.testCallOnce = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").once();
  assert.ok(!mocket.verifyMocks());
  m.func();
  assert.ok(mocket.verifyMocks());
  m.func();
  assert.ok(!mocket.verifyMocks());
}

module.exports.testCallN = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").times(3);
  assert.ok(!mocket.verifyMocks());
  m.func();
  assert.ok(!mocket.verifyMocks());
  m.func();
  assert.ok(!mocket.verifyMocks());
  m.func();
  assert.ok(mocket.verifyMocks());
}

module.exports.testCallNever = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").never();
  assert.ok(mocket.verifyMocks());
  m.func();
  assert.ok(!mocket.verifyMocks());
}

module.exports.testAllowsNotCalled = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.allows("allowed");
  m.allowed();
  m.allowed();
  assert.ok(mocket.verifyMocks());
}

module.exports.testAllowsNotCalled = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.allows("allowed");
  assert.ok(mocket.verifyMocks());
}

module.exports.testWithArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", 1);
  m.func("hello", 1);
  assert.ok(mocket.verifyMocks());
  m.func();
  assert.ok(!mocket.verifyMocks());
}

module.exports.testDifferentArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", 1).once();
  m.expects("func").passing("goodbye", 2).once();
  m.func("hello", 1);
  assert.ok(!mocket.verifyMocks());
  m.func("goodbye", 2);
  assert.ok(mocket.verifyMocks());
}

module.exports.testReturn = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").once().returning("gotcha");
  var ret = m.func();
  assert.equal("gotcha", ret);
}

module.exports.testReturnDifferentArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", 1).once().returning("first");
  m.expects("func").passing("goodbye", 2).once().returning("second");
  var ret1 = m.func("hello", 1);
  assert.equal("first", ret1);
  var ret2 = m.func("goodbye", 2);
  assert.equal("second", ret2);
  assert.ok(mocket.verifyMocks());
}

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
  assert.ok(mocket.verifyMocks());
}

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
  assert.ok(mocket.verifyMocks());
}

module.exports.testAnyArgs = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing(mocket.ANYARGS).times(3);
  m.func();
  m.func("A string");
  m.func("Lots", "of", -1, ["loverly", "args"]);
  assert.ok(mocket.verifyMocks());
}

module.exports.testAnythingArg = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", mocket.ANYTHING);
  m.func("hello", 123);
  assert.ok(mocket.verifyMocks());
  m.func("hello", [1,2,3]);
  assert.ok(mocket.verifyMocks());
  m.func("goodbye", [1,2,3]);
  assert.ok(!mocket.verifyMocks());
}

module.exports.testInstanceOfNumberArg = function() {
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", mocket.any('number'));
  m.func("hello", 123);
  assert.ok(mocket.verifyMocks());
  m.func("hello", [1,2,3]);
  assert.ok(!mocket.verifyMocks());
}

module.exports.testInstanceOfCustomObjectArg = function() {
  function Foo() {};
  function Bar() {};
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", mocket.any(Foo));
  m.func("hello", new Foo());
  assert.ok(mocket.verifyMocks());
  m.func("hello", new Bar());
  assert.ok(!mocket.verifyMocks());
}

module.exports.testInstanceMatcherArg = function() {
  function Foo() {};
  function Bar() {};
  var mocket = newContext();
  var m = mocket.createMock("one");
  m.expects("func").passing("hello", function(a) {return a === 1 || a === 2});
  m.func("hello", 1);
  m.func("hello", 2);
  assert.ok(mocket.verifyMocks());
  m.func("hello", 3);
  assert.ok(!mocket.verifyMocks());
}

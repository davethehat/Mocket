"use strict";


// mock.expects("aFunc").passing(arg,arg...).times(3).returning(123);
// mock.expects("aFunc").passing(arg,arg...).never();
// mock.expects("aFunc").passing(arg,arg...).times(3).as(function(){});


function Mocket() {
  return new MockContext();
}

Mocket.MANY = -1;
Mocket.ANYTHING = {
  matches  : function() {return true},
  toString : function() {return "ANYTHING"}
};
Mocket.ANYARGS  = { toString : function() {return "ANYARGS"}};

module.exports.Mocket = Mocket;

function argumentsToString(args) {
  args = Array.prototype.slice.call(args);
  return "(" + args.join(",") + ")";
}

function MockContext() {
  this.mocks = [];
}

MockContext.prototype = {
  ANYTHING : Mocket.ANYTHING,
  ANYARGS  : Mocket.ANYARGS,
  any      : function(type) {
    return {
      matches  : function(x) {return typeof type === "string" ? typeof x === type : x instanceof type},
      toString : function()  {return "(any " + (typeof type === "string" ? type : type.name) + ")"}
    };
  },
  createMock : function(name) {
    var m = new Mock(name || "anonymous");
    this.registerMock(m);
    return m;
  },
  registerMock : function(mock) {
    this.mocks.push(mock);
  },
  verifyMocks : function(collector) {
    if (collector === true) {
      collector = {
        ok         : function (e) {console.log(e.toString())},
        fail       : function (e) {console.log(e.toString())},
        unexpected : function (a) {console.log(a.name + argumentsToString(a.args) + " UNEXPECTED")}
      };
    }
    var fails = false;
    this.mocks.forEach(function(mock) {
      fails = fails || !mock.verify(collector);
    })
    return !fails;
  },
  assertMocks : function() {
    var collector = {
      okCalls : [],
      failCalls : [],
      unexpectedCalls : [],
      ok: function(e) {this.okCalls.push(e)},
      fail: function(e) {this.failCalls.push(e)},
      unexpected: function(a) {this.unexpectedCalls.push(a)}
    };
    if (!this.verifyMocks(collector)) {
      throw new MockAssertionError()
    }
  }
}

function MockAssertionError(message) {
  this.prototype = Error.prototype;
  this.name = "MockAssertionError";
  this.message = message || "(unknown)";
}

function Mock(name) {
  this.name = name;
  this.calls = {};
  this.unexpected = [];
}

Mock.prototype = {
  expects : function (methodName) {
    var e = new Expectation(this, methodName);
    this.calls[methodName] = this.calls[methodName] || [];
    this.calls[methodName].push(e);

    this[methodName] = function foo() {
      var returned = false;
      var ret;
      this.calls[methodName].forEach(function(ex) {
        if (ex.matches(foo.arguments)) {
          returned = true;
          ret =  ex.call.apply(ex, arguments);
        }
      });
      if (returned) {
        return ret;
      } else {
        this.unexpected.push({name : methodName, args: arguments});
      }
    };
    return e;
  },
  allows : function(methodName) {
    this[methodName] = function() {}
  },
  verify : function(collector) {
    var res = [];
    for (var f in this.calls) {
      if (this.calls.hasOwnProperty(f)) {
        res = res.concat(this.calls[f].map(function (e) { return e.verify(collector) }));
      }
    }
    var callsOK =  !res.some(function (r) { return r === false });
    var unexpectedOK = true;
    this.unexpected.forEach(function(call) {
      unexpectedOK = false;
      !collector || collector.unexpected(call);
    });
    return callsOK && unexpectedOK;
  }
};

function Expectation(mock, name) {
  this.mock = mock;
  this.name = name;
  this.args = [];
  this.impl = function() {}
  this.numcalls = 0;
  this.callsExpected = Mocket.MANY;
}

Expectation.prototype = {
  passing   : function() {
    this.args = arguments;
    return this;
  },
  times     : function(n) { this.callsExpected = n; return this; },
  once      : function() { return this.times(1);},
  never     : function() { return this.times(0);},
  returning : function(value) { return this.as( function() { return value;})},
  as        : function(fn) {this.impl = fn},
  call      : function() {
    // Mock ensures that the arguments match
    this.numcalls++;
    if (typeof(this.impl) === 'function') {
      return this.impl.apply(this, arguments);
    } else {
      return this.impl[this.name].apply(this.impl, arguments);
    }
  },
  matches   : function(args) {
    if (this.args[0] === Mocket.ANYARGS) return true;
    if (args.length !== this.args.length) return false;

    for (var i = 0; i < args.length; i++) {
      if (typeof this.args[i] === 'function') {
        if (!this.args[i](args[i])) return false;
      } else if (this.args[i].hasOwnProperty("matches")) {
        if (!this.args[i].matches(args[i])) return false;
      } else {
        if (this.args[i] !== args[i]) return false;
      }
    };
    return true;
  },
  verify    : function(collector) {
    var ok = this.fulfilled();
    if (ok) {
      !collector || collector.ok(this);
    } else {
      !collector || collector.fail(this);
    }
    return ok;
  },
  fulfilled  : function() {
    return this.callsExpected === Mocket.MANY && this.numcalls > 0 || this.callsExpected === this.numcalls;
  },
  toString   : function() {
    var expected = this.callsExpected === Mocket.MANY ? "n" : this.callsExpected;
    return "EXPECTATION " + this.mock.name + "." + this.name + argumentsToString(this.args)
      + " [" + expected  + "/" + this.numcalls + "] "
      + (this.fulfilled ? "ok" : "FAIL");
  }
}

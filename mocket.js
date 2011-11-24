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

var assert = require('assert');

function equals(obj1, obj2) {
  // Doing this this way rather than adding .equals to the various prototypes improves
  // compatibility with libraries (e.g. mongoose) that make assumptions about objects, or
  // which in turn mess around with the prototypes.
  if (obj1 === obj2) return true;

  if (obj1 !== undefined && obj2 !== undefined && obj1.valueOf() === obj2.valueOf()) return true;

  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    return obj1.toString() === obj2.toString();
  }

  if (obj1 instanceof Array && obj2 instanceof Array) {
    if (obj1.length !== obj2.length) return false;
    
    for (var i = 0; i < obj1.length; i++) {
      if (!equals(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    for (var f in obj1) {
      if (obj1.hasOwnProperty(f) && obj1[f] instanceof RegExp || typeof obj1[f] !== 'function') {
        if (!equals(obj1[f], obj2[f])) return false;
      }
    }
    for (var g in obj2) {
      if (obj2.hasOwnProperty(g) && obj2[g] instanceof RegExp || typeof obj2[g] !== 'function') {
        if (obj1[g] === undefined) return false;
      }
    }
    return true;
  }
  
  return false;
}

module.exports.equals = equals;

Array.prototype.find = function(fn) {
  for (var i = 0; i < this.length; i++) {
    if (fn(this[i])) return this[i];
  }
  return undefined;
}

function Mocket() {
  return new MockContext();
}

Mocket.MANY = -1;
Mocket.ANYTHING = {
  matches  : function() { return true },
  toString : function() { return "ANYTHING" }
};
Mocket.ANYARGS  = {
  toString : function() { return "ANYARGS" }
};

module.exports.Mocket = Mocket;

function argumentsToString(args) {
  args = Array.prototype.slice.call(arguments);
  var ret = "(";
  args.forEach(function(a, index) {
    if (index > 0) ret += ",";
    ret += JSON.stringify(a);
  });
  ret += ")";
  return ret;
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
      ok: function(e) {this.okCalls.push(e.toString())},
      fail: function(e) {this.failCalls.push(e.toString())},
      unexpected: function(a) {this.unexpectedCalls.push(a.name + argumentsToString(a.args))}
    };
    if (!this.verifyMocks(collector)) {
      var report = [];
      collector.failCalls.forEach(function (e) { report.push(e.toString())});
      collector.unexpectedCalls.forEach(function (a) { report.push(a + " UNEXPECTED")});
      assert.fail(report.join(", "), "", "", "", assert.fail);
    }
  }
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

    var self = this;
    this[methodName] = function foo() {
      var args = arguments;
      var ex = self.calls[methodName].find(function(x) {return x.matches(args);});
      if (ex) {
        return ex.call.apply(ex, arguments);
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
  this.callsExpectedMin = Mocket.MANY;
  this.callsExpectedMax = Mocket.MANY;
}

Expectation.prototype = {
  passing   : function()  { this.args = arguments; return this; },
  times     : function(n) { this.callsExpectedMin = this.callsExpectedMax = n; return this; },
  once      : function()  { return this.times(1);},
  never     : function()  { return this.times(0);},
  atLeast   : function(n) { this.callsExpectedMin = n; return this; },
  atMost    : function(n) { this.callsExpectedMax = n; return this; },
  returning : function()  {
    var returns = Array.prototype.slice.call(arguments);
    return this.as( function() {
      return returns.length === 1 ? returns[0] : returns.shift();
    });
  },
  throwing  : function(ex) {
    return this.as( function() {
      throw typeof(ex) === 'function' ? new ex()
        : ex ? ex
        : new Error("thrown by " + this.signature());
    });
  },
  as        : function(fn) { this.impl = fn; return this},
  
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
      var arg = this.args[i];
      var passed = args[i];
      if (typeof arg === 'function') {
        if (!arg(passed)) return false;
      } else if (arg.hasOwnProperty("matches") && typeof arg.matches === 'function') {
        if (!arg.matches(passed)) return false;
      } else {
        if (!equals(arg, passed)) return false;
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
  expectingMany : function() {
      return this.callsExpectedMin === Mocket.MANY && this.callsExpectedMax === Mocket.MANY;
  },
  expectingN : function() {
      return !this.expectingMany() && this.callsExpectedMin === this.callsExpectedMax;
  },
  fulfilled  : function() {
    if (this.expectingMany()) {
      return this.numcalls > 0;
    }
    var ok = true;
    if (this.callsExpectedMin !== Mocket.MANY) {
      ok = this.numcalls >= this.callsExpectedMin;
    }
    if (ok && this.callsExpectedMax !== Mocket.MANY) {
      ok = this.numcalls <= this.callsExpectedMax;
    }
    return ok;
  },
  rangeAsString : function() {
    if (this.expectingMany()) return "n";
    if (this.expectingN()) return "" + this.callsExpectedMin;

    var ret = "";
    if (this.callsExpectedMin !== Mocket.MANY) {
      ret += this.callsExpectedMin;
    }
    ret += "-";
    if (this.callsExpectedMax !== Mocket.MANY) {
      ret += this.callsExpectedMax;
    }
    return ret;
  },
  toString   : function() {
    return "EXPECTATION " + this.signature()
      + " [" + this.rangeAsString() + "/" + this.numcalls + "] "
      + (this.fulfilled() ? "ok" : "FAIL");
  },
  signature  : function() {
    return this.mock.name + "." + this.name + argumentsToString(this.args);
  }
}

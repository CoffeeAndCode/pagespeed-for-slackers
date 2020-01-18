var test = require("./index.js");

var mock = {
  fail: function(str) {
    console.log("FAIL: " + str);
  },

  succeed: function(str) {
    console.log(str);
  }
};

test.handler({ url: "http://example.com" }, mock);

/**
 * Mini Unit Test Harness
 * Copyright(c) 2014, Google Inc.
 *
 * A really tiny unit test harness.
 */
var muther = muther || {};

var $ = function(s) { return document.querySelector(s) || {}; }
muther.assert = function(cond, err) { if (!cond) { throw err; } };
muther.assertEquals = function(a, b, err) { muther.assert(a === b, err); };

muther.set_ = function(id, style, innerHTML) {
  $('#' + id).innerHTML = '';
  document.body.innerHTML += '<div id="' + id + '" style="' + style + '">' + innerHTML + '</div>';
};

muther.go = function(spec) {
  Object.keys(spec['tests']).forEach(function(testName) {
    var test = spec['tests'][testName];
    if (test instanceof Promise) {
      muther.set_(testName, 'color:#F90', 'RUNNING: ' + testName);
      // TODO: What if we want setup() and tearDown()?
      test.then(function() {
        muther.set_(testName, 'color:#090', 'PASS: ' + testName);
      }, function(err) {
        muther.set_(testName, 'color:#900', 'FAIL: ' + testName + ': ' + err);
      });
    } else if (test instanceof Function) {
      var setup = spec['setUp'] || function(){};
      var tearDown = spec['tearDown'] || function(){};
      try {
        setup(); test(); tearDown();
        muther.set_(testName, 'color:#090', 'PASS: ' + testName);
      } catch (err) {
        muther.set_(testName, 'color:#900', 'FAIL: ' + testName + ': ' + err);
      }
    }
  });
};

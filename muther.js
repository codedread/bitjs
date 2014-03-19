/**
 * Mini Unit Test Harness
 * Copyright(c) 2014, Google Inc.
 *
 * A really tiny unit test harness.
 */
var muther = muther || {};

muther.assert = function(cond, err) { if (!cond) { throw err; } };
muther.assertEquals = function(a, b, err) { muther.assert(a === b, err); };

muther.addResult_ = function(innerHTML, pass) {
  document.body.innerHTML += '<div style="' +
      (pass ? 'color:#090' : 'color:#900') + '">' + innerHTML + '</div>';
};

muther.go = function(spec) {
  var setup = spec['setUp'] || function(){};
  var tearDown = spec['tearDown'] || function(){};
  spec['tests'].forEach(function(test) {
    try {
      setup(); test(); tearDown();
      muther.addResult_('PASS: ' + test.name, true);
    } catch(e) {
      muther.addResult_('FAIL: ' + test.name + ': ' + e, false);
    }
  });
};

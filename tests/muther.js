/**
 * Minimal Unit Test Harness
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2014, Google Inc.
 */
var muther = {};

muther.assert = function(cond, err) { if (!cond) { throw err; } };
muther.assertEquals = function(a, b, err) { muther.assert(a === b, err); };
muther.assertThrows = function(fn, err) {
  let threw = false;
  try { fn(); } catch (e) { threw = true; }
  muther.assert(threw, err);
};

muther.$ = function(id) {
  let el = document.querySelector('#' + id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
};

muther.set_ = function(id, style, innerHTML) {
  muther.$(id).setAttribute('style', style);
  muther.$(id).innerHTML = innerHTML;
};

muther.go = function(spec) {
  let prevResult = Promise.resolve(true);
  for (let testName in spec['tests']) {
    muther.set_(testName, 'color:#F90', 'RUNNING: ' + testName);
    try {
      prevResult = prevResult.then(() => {
        if (spec['setUp']) spec['setUp']();
        const thisResult = spec['tests'][testName]() || Promise.resolve(true);
        return thisResult.then(() => {
          if (spec['tearDown']) spec['tearDown']();
          muther.set_(testName, 'color:#090', 'PASS: ' + testName);
        });
      }).catch(err => muther.set_(testName, 'color:#900', 'FAIL: ' + testName + ': ' + err));
    } catch (err) {
      muther.set_(testName, 'color:#900', 'FAIL: ' + testName + ': ' + err);
    }
  }
};

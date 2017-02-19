/*
 * archive-test.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2017 Google Inc.
 */

var assertEquals = muther.assertEquals;
var testInputs = {
    'testUnzipDeflate': 'archive-testfiles/test-unzip-deflate.json',
    'testUnzipStore': 'archive-testfiles/test-unzip-store.json',
    'testUnrar': 'archive-testfiles/test-unrar.json',
};

var testSuite = {tests: {}};
for (var testName in testInputs) {
  var testInputFilename = testInputs[testName];
  testSuite.tests[testName] = new Promise(function(resolve, reject) {
      var scriptEl = document.createElement('script');
      scriptEl.setAttribute('src', testInputFilename);
      scriptEl.addEventListener('load', function(evt) {
        // document.body.removeChild(scriptEl);
        var testFile = window.archiveTestFile;
        var archivedFile = new Uint8Array(
            atob(testFile.archivedFile)
                .split(',')
                .map(function(str) { return parseInt(str); })
        );
        var unarchivedFile = new Uint8Array(
            atob(testFile.unarchivedFile)
                .split(',')
                .map(function(str) { return parseInt(str); })
        );

        var unarchiver = bitjs.archive.GetUnarchiver(archivedFile.buffer, '../archive/');
        unarchiver.addEventListener(bitjs.archive.UnarchiveEvent.Type.EXTRACT, function(evt) {
            var theUnarchivedFile = evt.unarchivedFile.fileData;
            try {
              assertEquals(theUnarchivedFile.length, unarchivedFile.length,
                  'The unarchived buffer was not the right length');
              for (var i = 0; i < theUnarchivedFile.length; ++i) {
                assertEquals(theUnarchivedFile[i], unarchivedFile[i],
                    'Byte #' + i + ' did not match');
              }
              resolve();
            } catch (err) {
              reject(err);
            }
        });
        unarchiver.start();
      });
      document.body.appendChild(scriptEl);
  });
}

muther.go(testSuite);

/*
 * test-uploader.js
 *
 * Provides readers for byte streams.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2017 Google Inc.
 */

/**
 * TODO:
 * - ask user to choose the archived binary file
 * - read it in as bytes, convert to text
 * - ask user to choose the unarchived file
 * - put the binary and text results together in a JSON blob:
  {
    "archivedFile": ...,
    "unarchivedFIle": ...
  }
 */

var archiveUploaderEl = null;
var archivedFileAsText = null;
var unarchiveUploaderEl = null;
var unarchivedFileAsText = null;

function init() {
  archiveUploaderEl = document.querySelector('#archive-uploader');
  unarchiveUploaderEl = document.querySelector('#unarchive-uploader');

  archiveUploaderEl.addEventListener('change', getArchivedFile, false);
  unarchiveUploaderEl.addEventListener('change', getUnarchivedFile, false);
}

function getArchivedFile(evt) {
  var filelist = evt.target.files;
  var fr = new FileReader();
  fr.onload = function() {
      var arr = new Uint8Array(fr.result);
      archivedFileAsText = btoa(arr);
      archiveUploaderEl.setAttribute('disabled', 'true');
      unarchiveUploaderEl.removeAttribute('disabled');
  };
  fr.readAsArrayBuffer(filelist[0]);
}

function getUnarchivedFile(evt) {
  var filelist = evt.target.files;
  var fr = new FileReader();
  fr.onload = function() {
      var arr = new Uint8Array(fr.result);
      unarchivedFileAsText = btoa(arr);
      unarchiveUploaderEl.setAttribute('disabled', 'true');
      output();
  };
  fr.readAsArrayBuffer(filelist[0]);
}

function output() {
  var json = 'window.archiveTestFile = {\n';
  json += '  "archivedFile": "' + archivedFileAsText + '",\n';
  json += '  "unarchivedFile": "' + unarchivedFileAsText + '"\n';
  json += '}';
  debugger;
  window.open('data:application/json;utf8,' + json);
}

// To turn the base64 string back into bytes:
// new Uint8Array(atob(archivedFileAsText).split(',').map(s => parseInt(s)))

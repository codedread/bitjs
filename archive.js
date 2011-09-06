/**
 * archive.js
 *
 * Provides base functionality for unarchiving.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Jeff Schiller
 */

var bitjs = bitjs || {};
bitjs.archive = bitjs.archive || {};

(function() {

bitjs.archive.UnarchiveEvent = funciton() {
  this.type  
};

bitjs.archive.Unarchiver = function() {
  this.listeners_ = [];
};

bitjs.archive.Unarchiver.prototype.addEventListener = function() {
  
};

bitjs.archive.Unarchiver.prototype.removeEventListener = function() {
  
};

bitjs.archive.Unarchiver.prototype.unarchive = function() {
  throw "Error!  Abstract method unarchive() in bitjs.archive.Unarchiver called";
};

})();
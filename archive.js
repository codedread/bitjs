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

/**
 * @param {string} type The event type.
 * @constructor
 */
bitjs.archive.UnarchiveEvent = function(type) {
  this.type = type;
};

bitjs.archive.UnarchiveEvent.Type = {
  START: 'bitjs.archive.UnarchiveEvent.START',
  PROGRESS: 'bitjs.archive.UnarchiveEvent.PROGRESS',
  EXTRACTION: 'bitjs.archive.UnarchiveEvent.EXTRACTION',
  FINISH: 'bitjs.archive.UnarchiveEvent.FINISH',
  ERROR: 'bitjs.archive.UnarchiveEvent.ERROR'
};

/**
 * Base abstract class for all Unarchivers.
 *
 * @param {ArrayBuffer} arrayBuffer The Array Buffer.
 */
bitjs.archive.Unarchiver = function(arrayBuffer) {
  /**
   * @type {ArrayBuffer}
   */
  this.ab_ = arrayBuffer;

  /**
   * A map from event type to an array of listeners.
   * @type {Map.<string, Array>}
   */
  this.listeners_ = {
    bitjs.archive.UnarchiveEvent.Type.START: [],
    bitjs.archive.UnarchiveEvent.Type.PROGRESS: [],
    bitjs.archive.UnarchiveEvent.Type.EXTRACTION: [],
    bitjs.archive.UnarchiveEvent.Type.FINISH: [],
    bitjs.archive.UnarchiveEvent.Type.ERROR: []
  };
};

/**
 *
 */
bitjs.archive.Unarchiver.prototype.addEventListener = function() {
};

/**
 *
 */
bitjs.archive.Unarchiver.prototype.removeEventListener = function() {
};

/**
 * Abstract method - do not call directly.
 */
bitjs.archive.Unarchiver.prototype.unarchive = function() {
  throw "Error!  Abstract method unarchive() in bitjs.archive.Unarchiver called";
};

})();
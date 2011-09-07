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

/**
 * The UnarchiveEvent types.
 */
bitjs.archive.UnarchiveEvent.Type = {
  START: 'start',
  PROGRESS: 'progress',
  EXTRACT: 'extract',
  FINISH: 'finish',
  ERROR: 'error'
};

/**
 * All extracted files returned by an Unarchiver will implement
 * the following interface:
 *
 * interface UnarchivedFile {
 *   string filename
 *   TypedArray filedata  
 * }
 *
 */

/**
 * Base abstract class for all Unarchivers.
 *
 * @param {ArrayBuffer} arrayBuffer The Array Buffer.
 */
bitjs.archive.Unarchiver = function(arrayBuffer) {
  /**
   * The ArrayBuffer object.
   * @type {ArrayBuffer}
   * @protected
   */
  this.ab = arrayBuffer;

  /**
   * A map from event type to an array of listeners.
   * @type {Map.<string, Array>}
   */
  this.listeners_ = {};
  for (var type in bitjs.archive.UnarchiveEvent.Type) {
    this.listeners_[bitjs.archive.UnarchiveEvent.Type[type]] = [];
  }
};

/**
 * Adds an event listener for UnarchiveEvents.
 *
 * @param {string} Event type.
 * @param {EventListener|function} An event listener or handler function.
 */
bitjs.archive.Unarchiver.prototype.addEventListener = function(type, listener) {
  if (type in this.listeners_) {
    if (this.listeners_[type].indexOf(listener) == -1) {
      this.listeners_[type].push(listener);
    }
  }
};

/**
 * Removes an event listener.
 *
 * @param {string} Event type.
 * @param {EventListener|function} An event listener or handler function.
 */
bitjs.archive.Unarchiver.prototype.removeEventListener = function(type, listener) {
  if (type in this.listeners_) {
    var index = this.listeners_[type].indexOf(listener);
    if (index != -1) {
      this.listeners_[type].splice(index, 1);
    }
  }
};

/**
 * Abstract method - do not call directly.
 */
bitjs.archive.Unarchiver.prototype.run = function() {
  throw "Error! Abstract method bitjs.archive.Unarchiver.run() called.";
};

})();
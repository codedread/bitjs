/**
 * archive.js
 *
 * Provides base functionality for unarchiving.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 */

/**
 * An unarchive event.
 */
export class UnarchiveEvent {
  /**
   * @param {string} type The event type.
   */
  constructor(type) {
    /**
     * The event type.
     * @type {string}
     */
    this.type = type;
  }
}

/**
 * The UnarchiveEvent types.
 */
export const UnarchiveEventType = {
  START: 'start',
  PROGRESS: 'progress',
  EXTRACT: 'extract',
  FINISH: 'finish',
  INFO: 'info',
  ERROR: 'error'
};

/**
 * Useful for passing info up to the client (for debugging).
 */
export class UnarchiveInfoEvent extends UnarchiveEvent {
  /**
   * @param {string} msg The info message.
   */
  constructor(msg) {
    super(UnarchiveEventType.INFO);

    /**
     * The information message.
     * @type {string}
     */
    this.msg = msg;
  }
}

/**
 * An unrecoverable error has occured.
 */
export class UnarchiveErrorEvent extends UnarchiveEvent {
  /**
   * @param {string} msg The error message.
   */
  constructor(msg) {
    super(UnarchiveEventType.ERROR);

    /**
     * The information message.
     * @type {string}
     */
    this.msg = msg;
  }
}

/**
 * Start event.
 */
export class UnarchiveStartEvent extends UnarchiveEvent {
  constructor() {
    super(UnarchiveEventType.START);
  }
}

/**
 * Finish event.
 */
export class UnarchiveFinishEvent extends UnarchiveEvent {
  /**
   * @param {Object} metadata A collection fo metadata about the archive file.
   */
  constructor(metadata = {}) {
    super(UnarchiveEventType.FINISH);
    this.metadata = metadata;
  }
}

/**
 * Progress event.
 */
export class UnarchiveProgressEvent extends UnarchiveEvent {
  /**
   * @param {string} currentFilename
   * @param {number} currentFileNumber
   * @param {number} currentBytesUnarchivedInFile
   * @param {number} currentBytesUnarchived
   * @param {number} totalUncompressedBytesInArchive
   * @param {number} totalFilesInArchive
   * @param {number} totalCompressedBytesRead
   */
  constructor(currentFilename, currentFileNumber, currentBytesUnarchivedInFile,
    currentBytesUnarchived, totalUncompressedBytesInArchive, totalFilesInArchive,
    totalCompressedBytesRead) {
    super(UnarchiveEventType.PROGRESS);

    this.currentFilename = currentFilename;
    this.currentFileNumber = currentFileNumber;
    this.currentBytesUnarchivedInFile = currentBytesUnarchivedInFile;
    this.totalFilesInArchive = totalFilesInArchive;
    this.currentBytesUnarchived = currentBytesUnarchived;
    this.totalUncompressedBytesInArchive = totalUncompressedBytesInArchive;
    this.totalCompressedBytesRead = totalCompressedBytesRead;
  }
}

/**
 * Extract event.
 */
export class UnarchiveExtractEvent extends UnarchiveEvent {
  /**
   * @param {UnarchivedFile} unarchivedFile
   */
  constructor(unarchivedFile) {
    super(UnarchiveEventType.EXTRACT);

    /**
     * @type {UnarchivedFile}
     */
    this.unarchivedFile = unarchivedFile;
  }
}

/**
 * All extracted files returned by an Unarchiver will implement
 * the following interface:
 *
 * interface UnarchivedFile {
 *   string filename
 *   TypedArray fileData
 * }
 *
 */

/**
 * Base class for all Unarchivers.
 */
export class Unarchiver {
  /**
   * @param {ArrayBuffer} arrayBuffer The Array Buffer.
   * @param {string} opt_pathToBitJS Optional string for where the BitJS files are located.
   */
  constructor(arrayBuffer, opt_pathToBitJS) {
    /**
     * The ArrayBuffer object.
     * @type {ArrayBuffer}
     * @protected
     */
    this.ab = arrayBuffer;

    /**
     * The path to the BitJS files.
     * @type {string}
     * @private
     */
    this.pathToBitJS_ = opt_pathToBitJS || '/';

    /**
     * A map from event type to an array of listeners.
     * @type {Map.<string, Array>}
     */
    this.listeners_ = {};
    for (let type in UnarchiveEventType) {
      this.listeners_[UnarchiveEventType[type]] = [];
    }

    /**
     * Private web worker initialized during start().
     * @type {Worker}
     * @private
     */
    this.worker_ = null;
  }

  /**
   * This method must be overridden by the subclass to return the script filename.
   * @return {string} The script filename.
   * @protected.
   */
  getScriptFileName() {
    throw 'Subclasses of AbstractUnarchiver must overload getScriptFileName()';
  }

  /**
   * Adds an event listener for UnarchiveEvents.
   *
   * @param {string} Event type.
   * @param {function} An event handler function.
   */
  addEventListener(type, listener) {
    if (type in this.listeners_) {
      if (this.listeners_[type].indexOf(listener) == -1) {
        this.listeners_[type].push(listener);
      }
    }
  }

  /**
   * Removes an event listener.
   *
   * @param {string} Event type.
   * @param {EventListener|function} An event listener or handler function.
   */
  removeEventListener(type, listener) {
    if (type in this.listeners_) {
      const index = this.listeners_[type].indexOf(listener);
      if (index != -1) {
        this.listeners_[type].splice(index, 1);
      }
    }
  }

  /**
   * Create an UnarchiveEvent out of the object sent back from the Worker.
   * @param {Object} obj
   * @return {UnarchiveEvent}
   * @private
   */
  createUnarchiveEvent_(obj) {
    switch (obj.type) {
      case UnarchiveEventType.START:
        return new UnarchiveStartEvent();
      case UnarchiveEventType.PROGRESS:
        return new UnarchiveProgressEvent(
          obj.currentFilename,
          obj.currentFileNumber,
          obj.currentBytesUnarchivedInFile,
          obj.currentBytesUnarchived,
          obj.totalUncompressedBytesInArchive,
          obj.totalFilesInArchive,
          obj.totalCompressedBytesRead);
      case UnarchiveEventType.EXTRACT:
        return new UnarchiveExtractEvent(obj.unarchivedFile);
      case UnarchiveEventType.FINISH:
        return new UnarchiveFinishEvent(obj.metadata);
      case UnarchiveEventType.INFO:
        return new UnarchiveInfoEvent(obj.msg);
      case UnarchiveEventType.ERROR:
        return new UnarchiveErrorEvent(obj.msg);
    }
  }

  /**
   * Receive an event and pass it to the listener functions.
   *
   * @param {Object} obj
   * @private
   */
  handleWorkerEvent_(obj) {
    const type = obj.type;
    if (type && Object.values(UnarchiveEventType).includes(type) &&
      this.listeners_[obj.type] instanceof Array) {
      const evt = this.createUnarchiveEvent_(obj);
      this.listeners_[evt.type].forEach(function (listener) { listener(evt) });
      if (evt.type == UnarchiveEventType.FINISH) {
        this.worker_.terminate();
      }
    } else {
      console.log(`Unknown object received from worker: ${obj}`);
    }
  }

  /**
   * Starts the unarchive in a separate Web Worker thread and returns immediately.
   */
  start() {
    const me = this;
    const scriptFileName = this.pathToBitJS_ + this.getScriptFileName();
    if (scriptFileName) {
      this.worker_ = new Worker(scriptFileName);

      this.worker_.onerror = function (e) {
        console.log('Worker error: message = ' + e.message);
        throw e;
      };

      this.worker_.onmessage = function (e) {
        if (typeof e.data == 'string') {
          // Just log any strings the workers pump our way.
          console.log(e.data);
        } else {
          me.handleWorkerEvent_(e.data);
        }
      };

      const ab = this.ab;
      this.worker_.postMessage({
        file: ab,
        logToConsole: false,
      });
      this.ab = null;
    }
  }

  /**
   * Adds more bytes to the unarchiver's Worker thread.
   * @param {ArrayBuffer} ab The ArrayBuffer with more bytes in it.
   */
  update(ab) {
    if (this.worker_) {
      this.worker_.postMessage({ bytes: ab });
    }
  }

  /**
   * Terminates the Web Worker for this Unarchiver and returns immediately.
   */
  stop() {
    if (this.worker_) {
      this.worker_.terminate();
    }
  }
}


/**
 * Unzipper
 */
export class Unzipper extends Unarchiver {
  constructor(arrayBuffer, opt_pathToBitJS) {
    super(arrayBuffer, opt_pathToBitJS);
  }

  getScriptFileName() { return 'archive/unzip.js'; }
}


/**
 * Unrarrer
 */
export class Unrarrer extends Unarchiver {
  constructor(arrayBuffer, opt_pathToBitJS) {
    super(arrayBuffer, opt_pathToBitJS);
  }

  getScriptFileName() { return 'archive/unrar.js'; }
}

/**
 * Untarrer
 * @extends {Unarchiver}
 * @constructor
 */
export class Untarrer extends Unarchiver {
  constructor(arrayBuffer, opt_pathToBitJS) {
    super(arrayBuffer, opt_pathToBitJS);
  }

  getScriptFileName() { return 'archive/untar.js'; };
}

/**
 * Factory method that creates an unarchiver based on the byte signature found
 * in the arrayBuffer.
 * @param {ArrayBuffer} ab
 * @param {string=} opt_pathToBitJS Path to the unarchiver script files.
 * @return {Unarchiver}
 */
export function getUnarchiver(ab, opt_pathToBitJS) {
  if (ab.byteLength < 10) {
    return null;
  }

  let unarchiver = null;
  const pathToBitJS = opt_pathToBitJS || '';
  const h = new Uint8Array(ab, 0, 10);

  // TODO: Use bitjs.file.sniffer.
  if (h[0] == 0x52 && h[1] == 0x61 && h[2] == 0x72 && h[3] == 0x21) { // Rar!
    unarchiver = new Unrarrer(ab, pathToBitJS);
  } else if (h[0] == 0x50 && h[1] == 0x4B) { // PK (Zip)
    unarchiver = new Unzipper(ab, pathToBitJS);
  } else { // Try with tar
    unarchiver = new Untarrer(ab, pathToBitJS);
  }
  return unarchiver;
}

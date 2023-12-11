/**
 * decompress.js
 *
 * Provides base functionality for unarchiving/decompression.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 */

 import { UnarchiveAppendEvent, UnarchiveErrorEvent, UnarchiveEvent, UnarchiveEventType,
  UnarchiveExtractEvent, UnarchiveFinishEvent, UnarchiveInfoEvent,
  UnarchiveProgressEvent, UnarchiveStartEvent, Unarchiver,
  UnrarrerInternal, UntarrerInternal, UnzipperInternal,
  getUnarchiverInternal } from './decompress-internal.js';

export {
  UnarchiveAppendEvent,
  UnarchiveErrorEvent,
  UnarchiveEvent,
  UnarchiveEventType,
  UnarchiveExtractEvent,
  UnarchiveFinishEvent,
  UnarchiveInfoEvent,
  UnarchiveProgressEvent,
  UnarchiveStartEvent,
  Unarchiver,
} 

/**
* All extracted files returned by an Unarchiver will implement
* the following interface:
*/

/**
 * @typedef UnarchivedFile
 * @property {string} filename
 * @property {Uint8Array} fileData
 */

/**
 * Creates a WebWorker with the given decompressor implementation (i.e. unzip.js)
 * and transfers a MessagePort for communication. Returns a Promise to the Worker.
 * @param {string} pathToBitJS The path to the bitjs folder.
 * @param {string} implFilename The decompressor implementation filename
 *     relative to the bitjs root (e.g. archive/unzip.js)
 * @param {MessagePort} implPort The MessagePort to connect to the decompressor
 *     implementation.
 * @returns {Promise<*>} Returns a Promise that resolves to the Worker object.
 */
const connectPortFn = (pathToBitJS, implFilename, implPort) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(pathToBitJS + 'archive/unarchiver-webworker.js', {
      type: 'module'
    });

    worker.postMessage({ implSrc: (pathToBitJS + implFilename), }, [implPort]);
    resolve(worker);
  });
};

// Thin wrappers of decompressors for clients who want to construct a specific
// unarchiver themselves rather than use getUnarchiver().
export class Unzipper extends UnzipperInternal {
  constructor(ab, options) { super(ab, connectPortFn, options); }
}

export class Unrarrer extends UnrarrerInternal {
  constructor(ab, options) { super(ab, connectPortFn, options); }
}

export class Untarrer extends UntarrerInternal {
  constructor(ab, options) { super(ab, connectPortFn, options); }
}

/**
* Factory method that creates an unarchiver based on the byte signature found
* in the ArrayBuffer.
* @param {ArrayBuffer} ab The ArrayBuffer to unarchive. Note that this ArrayBuffer
*     must not be referenced after calling this method, as the ArrayBuffer may be
*     tranferred to a different JS context once start() is called.
* @param {Object|string} options An optional object of options, or a string
*     representing where the path to the unarchiver script files.
* @returns {Unarchiver}
*/
export function getUnarchiver(ab, options = {}) {
  return getUnarchiverInternal(ab, connectPortFn, options);
}

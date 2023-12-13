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
         UnarchiveProgressEvent, UnarchiveStartEvent } from './events.js';
import { Unarchiver, UnrarrerInternal, UntarrerInternal, UnzipperInternal,
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
 * @typedef {import('./decompress-internal.js').UnarchiverOptions} UnarchiverOptions
 */

/**
 * Connects the MessagePort to the unarchiver implementation (e.g. unzip.js). If Workers exist
 * (e.g. web browsers or deno), imports the implementation inside a Web Worker. Otherwise, it
 * dynamically imports the implementation inside the current JS context.
 * The MessagePort is used for communication between host and implementation.
 * @param {string} implFilename The decompressor implementation filename relative to this path
 *     (e.g. './unzip.js').
 * @param {MessagePort} implPort The MessagePort to connect to the decompressor implementation.
 * @returns {Promise<void>} The Promise resolves once the ports are connected.
 */
const connectPortFn = async (implFilename, implPort) => {
  if (typeof Worker === 'undefined') {
    return import(`${implFilename}`).then(implModule => implModule.connect(implPort));
  }
  
  return new Promise((resolve, reject) => {
    const workerScriptPath = new URL(`./unarchiver-webworker.js`, import.meta.url).href;
    const worker = new Worker(workerScriptPath, { type: 'module' });
    worker.postMessage({ implSrc: implFilename }, [implPort]);
    resolve();
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
*     transferred to a different JS context once start() is called.
* @param {UnarchiverOptions|string} options An optional object of options, or a
*     string representing where the path to the unarchiver script files. The latter
*     is now deprecated (use UnarchiverOptions).
* @returns {Unarchiver}
*/
export function getUnarchiver(ab, options = {}) {
  return getUnarchiverInternal(ab, connectPortFn, options);
}

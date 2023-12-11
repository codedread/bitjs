/**
 * decompress-internal.js
 *
 * Provides base functionality for unarchiving, extracted here as an internal
 * module for unit testing. Import decompress.js instead.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 */

import { UnarchiveAppendEvent, UnarchiveErrorEvent, UnarchiveEvent, UnarchiveEventType,
         UnarchiveExtractEvent, UnarchiveFinishEvent, UnarchiveInfoEvent,
         UnarchiveProgressEvent, UnarchiveStartEvent } from './events.js';
import { findMimeType } from '../file/sniffer.js';

/**
 * @typedef UnarchivedFile
 * @property {string} filename
 * @property {Uint8Array} fileData
 */

/**
 * An enum for threading mode. Currently supporting only WebWorkers.
 */
export const ThreadingMode = {
  WEB_WORKER: 'WEB_WORKER',
}

/**
 * @typedef UnarchiverOptions
 * @property {string} pathToBitJS The path to the bitjs folder.
 * @property {boolean=} debug Set to true for verbose unarchiver logging.
 * @property {ThreadingMode=} threadingMode The default is WEB_WORKER.
 */

/**
 * Base class for all Unarchivers.
 */
export class Unarchiver extends EventTarget {
  /**
   * The client-side port that sends messages to, and receives messages from the
   * decompressor implementation.
   * @type {MessagePort}
   * @private
   */
  port_;

  /**
   * @param {ArrayBuffer} arrayBuffer The Array Buffer. Note that this ArrayBuffer must not be
   *     referenced once it is sent to the Unarchiver, since it is marked as Transferable and sent
   *     to the decompress implementation.
   * @param {Function(string, MessagePort):Promise<*>} connectPortFn A function that takes a path
   *     to a JS decompression implementation (unzip.js) and connects it to a MessagePort.
   * @param {UnarchiverOptions|string} options An optional object of options, or a string
   *     representing where the BitJS files are located.  The string version of this argument is
   *     deprecated.
   */
  constructor(arrayBuffer, connectPortFn, options = {}) {
    super();

    if (typeof options === 'string') {
      console.warn(`Deprecated: Don't send a raw string to Unarchiver()`);
      console.warn(`            send UnarchiverOptions instead.`);
      options = { 'pathToBitJS': options };
    }

    /**
     * The ArrayBuffer object.
     * @type {ArrayBuffer}
     * @protected
     */
    this.ab = arrayBuffer;

    /**
     * A factory method that connects a port to the decompress implementation.
     * @type {Function(MessagePort): Promise<*>}
     * @private
     */
    this.connectPortFn_ = connectPortFn;

    /**
     * The path to the BitJS files.
     * @type {string}
     * @private
     */
    this.pathToBitJS_ = options.pathToBitJS || '/';

    /**
     * @orivate
     * @type {boolean}
     */
    this.debugMode_ = !!(options.debug);
  }

  /**
   * This method must be overridden by the subclass to return the script filename.
   * @returns {string} The MIME type of the archive.
   * @protected.
   */
  getMIMEType() {
    throw 'Subclasses of Unarchiver must overload getMIMEType()';
  }

  /**
   * This method must be overridden by the subclass to return the script filename.
   * @returns {string} The script filename.
   * @protected.
   */
  getScriptFileName() {
    throw 'Subclasses of Unarchiver must overload getScriptFileName()';
  }

  /**
   * Create an UnarchiveEvent out of the object sent back from the implementation.
   * @param {Object} obj
   * @returns {UnarchiveEvent}
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
  handlePortEvent_(obj) {
    const type = obj.type;
    if (type && Object.values(UnarchiveEventType).includes(type)) {
      const evt = this.createUnarchiveEvent_(obj);
      this.dispatchEvent(evt);
      if (evt.type == UnarchiveEventType.FINISH) {
        this.stop();
      }
    } else {
      console.log(`Unknown object received from port: ${obj}`);
    }
  }

  /**
   * Starts the unarchive by connecting the ports and sending the first ArrayBuffer.
   */
  start() {
    const me = this;
    const messageChannel = new MessageChannel();
    this.port_ = messageChannel.port1;
    this.connectPortFn_(this.pathToBitJS_,
        this.getScriptFileName(), messageChannel.port2).then(() => {
      this.port_.onerror = function (e) {
        console.log('Impl error: message = ' + e.message);
        throw e;
      };
  
      this.port_.onmessage = function (e) {
        if (typeof e.data == 'string') {
          // Just log any strings the port pumps our way.
          console.log(e.data);
        } else {
          me.handlePortEvent_(e.data);
        }
      };
  
      const ab = this.ab;
      this.port_.postMessage({
        file: ab,
        logToConsole: this.debugMode_,
      }, [ab]);
      this.ab = null;  
    });
  }

  /**
   * Adds more bytes to the unarchiver.
   * @param {ArrayBuffer} ab The ArrayBuffer with more bytes in it. If opt_transferable is
   *     set to true, this ArrayBuffer must not be referenced after calling update(), since it
   *     is marked as Transferable and sent to the implementation.
   * @param {boolean=} opt_transferable Optional boolean whether to mark this ArrayBuffer
   *     as a Tranferable object, which means it can no longer be referenced outside of
   *     the implementation context.
   */
  update(ab, opt_transferable = false) {
    const numBytes = ab.byteLength;
    if (this.port_) {
      // Send the ArrayBuffer over, and mark it as a Transferable object if necessary.
      if (opt_transferable) {
        this.port_.postMessage({ bytes: ab }, [ab]);
      } else {
        this.port_.postMessage({ bytes: ab });
      }
    }

    this.dispatchEvent(new UnarchiveAppendEvent(numBytes));
  }

  /**
   * Closes the port to the decompressor implementation and terminates it.
   */
  stop() {
    if (this.port_) {
      this.port_.close();
      this.port_ = null;
    }
  }
}

export class UnzipperInternal extends Unarchiver {
  constructor(arrayBuffer, connectPortFn, options) {
    super(arrayBuffer, connectPortFn, options);
  }

  getMIMEType() { return 'application/zip'; }
  getScriptFileName() { return 'archive/unzip.js'; }
}

export class UnrarrerInternal extends Unarchiver {
  constructor(arrayBuffer, connectPortFn, options) {
    super(arrayBuffer, connectPortFn, options);
  }

  getMIMEType() { return 'application/x-rar-compressed'; }
  getScriptFileName() { return 'archive/unrar.js'; }
}

export class UntarrerInternal extends Unarchiver {
  constructor(arrayBuffer, connectPortFn, options) {
    super(arrayBuffer, connectPortFn, options);
  }

  getMIMEType() { return 'application/x-tar'; }
  getScriptFileName() { return 'archive/untar.js'; };
}

/**
 * Factory method that creates an unarchiver based on the byte signature found
 * in the arrayBuffer.
 * @param {ArrayBuffer} ab
 * @param {Function(string):Promise<*>} connectPortFn A function that connects the impl port.
 * @param {Object|string} options An optional object of options, or a string representing where
 *     the path to the unarchiver script files.
 * @returns {Unarchiver}
 */
 export function getUnarchiverInternal(ab, connectPortFn, options = {}) {
  if (ab.byteLength < 10) {
    return null;
  }

  let unarchiver = null;
  const mimeType = findMimeType(ab);

  if (mimeType === 'application/x-rar-compressed') { // Rar!
    unarchiver = new UnrarrerInternal(ab, connectPortFn, options);
  } else if (mimeType === 'application/zip') { // PK (Zip)
    unarchiver = new UnzipperInternal(ab, connectPortFn, options);
  } else { // Try with tar
    unarchiver = new UntarrerInternal(ab, connectPortFn, options);
  }
  return unarchiver;
}

// Re-export things that used to live here.
// TODO: When up-revving to a major new version, remove these exports?
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
};

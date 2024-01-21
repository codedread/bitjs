/**
 * compress.js
 *
 * Provides base functionality for compressing.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */

import { ZipCompressionMethod, getConnectedPort } from './common.js';

// NOTE: THIS IS A VERY HACKY WORK-IN-PROGRESS! THE API IS NOT FROZEN! USE AT YOUR OWN RISK!

/**
 * @typedef FileInfo An object that is sent to the implementation to represent a file to zip.
 * @property {string} fileName The name of the file. TODO: Includes the path?
 * @property {number} lastModTime The number of ms since the Unix epoch (1970-01-01 at midnight).
 * @property {Uint8Array} fileData The bytes of the file.
 */

// export const DeflateCompressionMethod = {
//   NO_COMPRESSION: 0,
//   COMPRESSION_FIXED_HUFFMAN: 1,
//   COMPRESSION_DYNAMIC_HUFFMAN: 2,
// }

/**
 * Data elements are packed into bytes in order of increasing bit number within the byte,
 * i.e., starting with the least-significant bit of the byte.
 * Data elements other than Huffman codes are packed starting with the least-significant bit of the
 * data element.
 * Huffman codes are packed starting with the most-significant bit of the code.
 */

/**
 * @typedef CompressorOptions
 * @property {ZipCompressionMethod} zipCompressionMethod
 */

/**
 * @readonly
 * @enum {string}
 */
export const CompressStatus = {
  NOT_STARTED: 'not_started',
  READY: 'ready',
  WORKING: 'working',
  COMPLETE: 'complete',
  ERROR: 'error',
};

/**
 * A thing that zips files.
 * NOTE: THIS IS A VERY HACKY WORK-IN-PROGRESS! THE API IS NOT FROZEN! USE AT YOUR OWN RISK!
 * TODO: Make a streaming / event-driven API.
 */
export class Zipper {
  /**
   * The client-side port that sends messages to, and receives messages from the
   * decompressor implementation.
   * @type {MessagePort}
   * @private
   */
  port_;

  /**
   * A function to call to disconnect the implementation from the host.
   * @type {Function}
   * @private
   */
  disconnectFn_;

  /**
   * @param {CompressorOptions} options
   */
  constructor(options) {
    /**
     * @type {ZipCompressionMethod}
     * @private
     */
    this.zipCompressionMethod = options.zipCompressionMethod || ZipCompressionMethod.STORE;
    if (this.zipCompressionMethod === ZipCompressionMethod.DEFLATE) throw `DEFLATE not supported.`;

    /**
     * @type {CompressStatus}
     * @private
     */
    this.compressState = CompressStatus.NOT_STARTED;

    /**
     * @type {Uint8Array}
     * @private
     */
    this.byteArray = new Uint8Array(0);
  }

  /**
   * Must only be called on a Zipper that has been started. See start().
   * @param {FileInfo[]} files 
   * @param {boolean} isLastFile 
   */
  appendFiles(files, isLastFile) {
    if (!this.port_) {
      throw `Port not initialized. Did you forget to call start() ?`;
    }
    if (![CompressStatus.READY, CompressStatus.WORKING].includes(this.compressState)) {
      throw `Zipper not in the right state: ${this.compressState}`;
    }

    this.port_.postMessage({ files, isLastFile });
  }

  /**
   * Send in a set of files to be compressed. Set isLastFile to true if no more files are to added
   * at some future state. The Promise will not resolve until isLastFile is set to true either in
   * this method or in appendFiles().
   * @param {FileInfo[]} files
   * @param {boolean} isLastFile
   * @returns {Promise<Uint8Array>} A Promise that will contain the entire zipped archive as an array
   *     of bytes.
   */
  async start(files, isLastFile) {
    const impl = await getConnectedPort('./zip.js');
    this.port_ = impl.hostPort;
    this.disconnectFn_ = impl.disconnectFn;
    return new Promise((resolve, reject) => {
      this.port_.onerror = (evt) => {
        console.log('Impl error: message = ' + evt.message);
        reject(evt.message);
      };

      this.port_.onmessage = (evt) => {
        if (typeof evt.data == 'string') {
          // Just log any strings the implementation pumps our way.
          console.log(evt.data);
        } else {
          switch (evt.data.type) {
            case 'start':
              this.compressState = CompressStatus.WORKING;
              break;
            case 'finish':
              this.compressState = CompressStatus.COMPLETE;
              this.port_.close();
              this.disconnectFn_();
              this.port_ = null;
              this.disconnectFn_ = null;
              resolve(this.byteArray);
              break;
            case 'compress':
              this.addBytes_(evt.data.bytes);
              break;
          }
        }
      };

      this.compressState = CompressStatus.READY;
      this.appendFiles(files, isLastFile);
    });
  }

  /**
   * Updates the internal byte array with new bytes (by allocating a new array and copying).
   * @param {Uint8Array} newBytes
   * @private
   */
  addBytes_(newBytes) {
    const oldArray = this.byteArray;
    this.byteArray = new Uint8Array(oldArray.byteLength + newBytes.byteLength);
    this.byteArray.set(oldArray);
    this.byteArray.set(newBytes, oldArray.byteLength);
  }
}
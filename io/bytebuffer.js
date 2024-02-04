/*
 * bytebuffer.js
 *
 * Provides a writer for bytes.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

// TODO: Allow big-endian and little-endian, with consistent naming.

/**
 * A write-only Byte buffer which uses a Uint8 Typed Array as a backing store.
 */
export class ByteBuffer {
  /**
   * @param {number} numBytes The number of bytes to allocate.
   */
  constructor(numBytes) {
    if (typeof numBytes != typeof 1 || numBytes <= 0) {
      throw "Error! ByteBuffer initialized with '" + numBytes + "'";
    }

    /**
     * @type {Uint8Array}
     * @public
     */
    this.data = new Uint8Array(numBytes);

    /**
     * Points to the byte that will next be written.
     * @type {number}
     * @public
     */
    this.ptr = 0;
  }

  /**
   * Returns an exact copy of all the data that has been written to the ByteBuffer.
   * @returns {Uint8Array}
   */
  getData() {
    const dataCopy = new Uint8Array(this.ptr);
    dataCopy.set(this.data.subarray(0, this.ptr));
    return dataCopy;
  }

  /**
   * @param {number} b The byte to insert.
   */
  insertByte(b) {
    if (this.ptr + 1 > this.data.byteLength) {
      throw `Cannot insert a byte, the buffer is full.`;
    }

    // TODO: throw if byte is invalid?
    this.data[this.ptr++] = b;
  }

  /**
   * @param {Array.<number>|Uint8Array|Int8Array} bytes The bytes to insert.
   */
  insertBytes(bytes) {
    if (this.ptr + bytes.length > this.data.byteLength) {
      throw `Cannot insert ${bytes.length} bytes, the buffer is full.`;
    }

    // TODO: throw if bytes is invalid?
    this.data.set(bytes, this.ptr);
    this.ptr += bytes.length;
  }

  /**
   * Writes an unsigned number into the next n bytes.  If the number is too large
   * to fit into n bytes or is negative, an error is thrown.
   * @param {number} num The unsigned number to write.
   * @param {number} numBytes The number of bytes to write the number into.
   */
  writeNumber(num, numBytes) {
    if (numBytes < 1 || !numBytes) {
      throw 'Trying to write into too few bytes: ' + numBytes;
    }
    if (num < 0) {
      throw 'Trying to write a negative number (' + num +
      ') as an unsigned number to an ArrayBuffer';
    }
    if (num > (Math.pow(2, numBytes * 8) - 1)) {
      throw 'Trying to write ' + num + ' into only ' + numBytes + ' bytes';
    }

    // Roll 8-bits at a time into an array of bytes.
    const bytes = [];
    while (numBytes-- > 0) {
      const eightBits = num & 255;
      bytes.push(eightBits);
      num >>= 8;
    }

    this.insertBytes(bytes);
  }

  /**
   * Writes a signed number into the next n bytes.  If the number is too large
   * to fit into n bytes, an error is thrown.
   * @param {number} num The signed number to write.
   * @param {number} numBytes The number of bytes to write the number into.
   */
  writeSignedNumber(num, numBytes) {
    if (numBytes < 1) {
      throw 'Trying to write into too few bytes: ' + numBytes;
    }

    const HALF = Math.pow(2, (numBytes * 8) - 1);
    if (num >= HALF || num < -HALF) {
      throw 'Trying to write ' + num + ' into only ' + numBytes + ' bytes';
    }

    // Roll 8-bits at a time into an array of bytes.
    const bytes = [];
    while (numBytes-- > 0) {
      const eightBits = num & 255;
      bytes.push(eightBits);
      num >>= 8;
    }

    this.insertBytes(bytes);
  }

  /**
   * @param {string} str The ASCII string to write.
   */
  writeASCIIString(str) {
    for (let i = 0; i < str.length; ++i) {
      const curByte = str.charCodeAt(i);
      if (curByte < 0 || curByte > 127) {
        throw 'Trying to write a non-ASCII string!';
      }
      this.insertByte(curByte);
    }
  }
}

/*
 * bytestream.js
 *
 * Provides readers for byte streams.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

var bitjs = bitjs || {};
bitjs.io = bitjs.io || {};


// TODO: Add method for pushing bits (multiple arrays) and have tests.
// TODO: Add method for tee-ing off the stream with tests.
/**
 * This object allows you to peek and consume bytes as numbers and strings
 * out of an ArrayBuffer.  In this buffer, everything must be byte-aligned.
 */
bitjs.io.ByteStream = class {
  /**
   * @param {ArrayBuffer} ab The ArrayBuffer object.
   * @param {number=} opt_offset The offset into the ArrayBuffer
   * @param {number=} opt_length The length of this BitStream
   */
  constructor(ab, opt_offset, opt_length) {
    if (!(ab instanceof ArrayBuffer)) {
      throw 'Error! BitArray constructed with an invalid ArrayBuffer object';
    }

    const offset = opt_offset || 0;
    const length = opt_length || ab.byteLength;
    this.bytes = new Uint8Array(ab, offset, length);
    this.ptr = 0;
  }


  /**
   * Peeks at the next n bytes as an unsigned number but does not advance the
   * pointer
   * TODO: This apparently cannot read more than 4 bytes as a number?
   * @param {number} n The number of bytes to peek at.  Must be a positive integer.
   * @return {number} The n bytes interpreted as an unsigned number.
   */
  peekNumber(n) {
    let num = parseInt(n, 10);
    if (n !== num || num <= 0) {
      throw 'Error!  Called peekNumber() with a non-positive integer';
    }

    let result = 0;
    // read from last byte to first byte and roll them in
    let curByte = this.ptr + num - 1;
    while (curByte >= this.ptr) {
      if (curByte >= this.bytes.byteLength) {
        throw 'Error!  Overflowed the byte stream while peekNumber()! n=' + num +
            ', ptr=' + this.ptr + ', bytes.length=' + this.bytes.length;
      }

      result <<= 8;
      result |= this.bytes[curByte];
      --curByte;
    }
    return result;
  }


  /**
   * Returns the next n bytes as an unsigned number (or -1 on error)
   * and advances the stream pointer n bytes.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @return {number} The n bytes interpreted as an unsigned number.
   */
  readNumber(n) {
    const num = this.peekNumber(n);
    this.ptr += n;
    return num;
  }


  /**
   * Returns the next n bytes as a signed number but does not advance the
   * pointer.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @return {number} The bytes interpreted as a signed number.
   */
  peekSignedNumber(n) {
    let num = this.peekNumber(n);
    const HALF = Math.pow(2, (n * 8) - 1);
    const FULL = HALF * 2;

    if (num >= HALF) num -= FULL;

    return num;
  }


  /**
   * Returns the next n bytes as a signed number and advances the stream pointer.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @return {number} The bytes interpreted as a signed number.
   */
  readSignedNumber(n) {
    const num = this.peekSignedNumber(n);
    this.ptr += n;
    return num;
  }


  /**
   * This returns n bytes as a sub-array, advancing the pointer if movePointers
   * is true.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @param {boolean} movePointers Whether to move the pointers.
   * @return {Uint8Array} The subarray.
   */
  peekBytes(n, movePointers) {
    let num = parseInt(n, 10);
    if (n !== num || num <= 0) {
      throw 'Error!  Called peekBytes() with a non-positive integer';
    }

    if (this.ptr + num > this.bytes.byteLength) {
      throw 'Error!  Overflowed the byte stream! n=' + num + ', ptr=' + this.ptr +
          ', bytes.length=' + this.bytes.length;
    }

    const result = this.bytes.subarray(this.ptr, this.ptr + num);

    if (movePointers) {
      this.ptr += num;
    }

    return result;
  }

  /**
   * Reads the next n bytes as a sub-array.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @return {Uint8Array} The subarray.
   */
  readBytes(n) {
    return this.peekBytes(n, true);
  }

  /**
   * Peeks at the next n bytes as an ASCII string but does not advance the pointer.
   * @param {number} n The number of bytes to peek at.  Must be a positive integer.
   * @return {string} The next n bytes as a string.
   */
  peekString(n) {
    let num = parseInt(n, 10);
    if (n !== num || num <= 0) {
      throw 'Error!  Called peekString() with a non-positive integer';
    }

    // TODO: return error if n would go past the end of the stream.

    let result = "";
    for (let p = this.ptr, end = this.ptr + n; p < end; ++p) {
      if (p >= this.bytes.byteLength) {
        throw 'Error!  Overflowed the byte stream while peekString()! n=' + num +
            ', ptr=' + this.ptr + ', bytes.length=' + this.bytes.length;
      }

      result += String.fromCharCode(this.bytes[p]);
    }
    return result;
  }

  /**
   * Returns the next n bytes as an ASCII string and advances the stream pointer
   * n bytes.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @return {string} The next n bytes as a string.
   */
  readString(n) {
    const strToReturn = this.peekString(n);
    this.ptr += n;
    return strToReturn;
  }
}

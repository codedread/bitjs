/*
 * bytestream.js
 *
 * A pull stream for bytes.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

/**
 * This object allows you to peek and consume bytes as numbers and strings out
 * of a stream.  More bytes can be pushed into the back of the stream via the
 * push() method.
 * By default, the stream is Little Endian (that is the least significant byte
 * is first). To change to Big Endian, use setBigEndian().
 */
export class ByteStream {
  /**
   * @param {ArrayBuffer} ab The ArrayBuffer object.
   * @param {number=} opt_offset The offset into the ArrayBuffer
   * @param {number=} opt_length The length of this ByteStream
   */
  constructor(ab, opt_offset, opt_length) {
    if (!(ab instanceof ArrayBuffer)) {
      throw 'Error! ByteStream constructed with an invalid ArrayBuffer object';
    }

    const offset = opt_offset || 0;
    const length = opt_length || ab.byteLength;

    /**
     * The current page of bytes in the stream.
     * @type {Uint8Array}
     * @private
     */
    this.bytes = new Uint8Array(ab, offset, length);

    /**
     * The next pages of bytes in the stream.
     * @type {Array<Uint8Array>}
     * @private
     */
    this.pages_ = [];

    /**
     * The byte in the current page that we will read next.
     * @type {Number}
     * @private
     */
    this.ptr = 0;

    /**
     * An ever-increasing number.
     * @type {Number}
     * @private
     */
    this.bytesRead_ = 0;

    /**
     * Whether the stream is little-endian (true) or big-endian (false).
     * @type {boolean}
     * @private
     */
    this.littleEndian_ = true;
  }

  /** @returns {boolean} Whether the stream is little-endian (least significant byte is first). */
  isLittleEndian() {
    return this.littleEndian_;
  }

  /**
   * Big-Endian means the most significant byte is first. it is sometimes called Motorola-style.
   * @param {boolean=} val The value to set. If not present, the stream is set to big-endian.
   */
  setBigEndian(val = true) {
    this.littleEndian_ = !val;
  }

  /**
   * Little-Endian means the least significant byte is first. is sometimes called Intel-style.
   * @param {boolean=} val The value to set. If not present, the stream is set to little-endian.
   */
  setLittleEndian(val = true) {
    this.littleEndian_ = val;
  }

  /**
   * Returns how many bytes have been consumed (read or skipped) since the beginning of time.
   * @returns {number}
   */
  getNumBytesRead() {
    return this.bytesRead_;
  }

  /**
   * Returns how many bytes are currently in the stream left to be read.
   * @returns {number}
   */
  getNumBytesLeft() {
    const bytesInCurrentPage = (this.bytes.byteLength - this.ptr);
    return this.pages_.reduce((acc, arr) => acc + arr.length, bytesInCurrentPage);
  }

  /**
   * Move the pointer ahead n bytes.  If the pointer is at the end of the current array
   * of bytes and we have another page of bytes, point at the new page.  This is a private
   * method, no validation is done.
   * @param {number} n Number of bytes to increment.
   * @private
   */
  movePointer_(n) {
    this.ptr += n;
    this.bytesRead_ += n;
    while (this.ptr >= this.bytes.length && this.pages_.length > 0) {
      this.ptr -= this.bytes.length;
      this.bytes = this.pages_.shift();
    }
  }

  /**
   * Peeks at the next n bytes as an unsigned number but does not advance the
   * pointer.
   * @param {number} n The number of bytes to peek at.  Must be a positive integer.
   * @returns {number} The n bytes interpreted as an unsigned number.
   */
  peekNumber(n) {
    const num = parseInt(n, 10);
    if (n !== num || num < 0) {
      throw 'Error!  Called peekNumber() with a non-positive integer';
    } else if (num === 0) {
      return 0;
    }

    if (n > 4) {
      throw 'Error!  Called peekNumber(' + n +
      ') but this method can only reliably read numbers up to 4 bytes long';
    }

    if (this.getNumBytesLeft() < num) {
      throw 'Error!  Overflowed the byte stream while peekNumber()! n=' + num +
      ', ptr=' + this.ptr + ', bytes.length=' + this.getNumBytesLeft();
    }

    let result = 0;
    let curPage = this.bytes;
    let pageIndex = 0;
    let ptr = this.ptr;
    for (let i = 0; i < num; ++i) {
      const exp = (this.littleEndian_ ? i : (num - 1 - i)) * 8;
      result |= (curPage[ptr++] << exp);

      if (ptr >= curPage.length) {
        curPage = this.pages_[pageIndex++];
        ptr = 0;
      }
    }

    return result;
  }


  /**
   * Returns the next n bytes as an unsigned number (or -1 on error)
   * and advances the stream pointer n bytes.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @returns {number} The n bytes interpreted as an unsigned number.
   */
  readNumber(n) {
    const num = this.peekNumber(n);
    this.movePointer_(n);
    return num;
  }


  /**
   * Returns the next n bytes as a signed number but does not advance the
   * pointer.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @returns {number} The bytes interpreted as a signed number.
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
   * @returns {number} The bytes interpreted as a signed number.
   */
  readSignedNumber(n) {
    const num = this.peekSignedNumber(n);
    this.movePointer_(n);
    return num;
  }


  /**
   * This returns n bytes as a sub-array, advancing the pointer if movePointers
   * is true.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @param {boolean} movePointers Whether to move the pointers.
   * @returns {Uint8Array} The subarray.
   */
  peekBytes(n, movePointers) {
    const num = parseInt(n, 10);
    if (n !== num || num < 0) {
      throw 'Error!  Called peekBytes() with a non-positive integer';
    } else if (num === 0) {
      return new Uint8Array();
    }

    const totalBytesLeft = this.getNumBytesLeft();
    if (num > totalBytesLeft) {
      throw 'Error!  Overflowed the byte stream during peekBytes! n=' + num +
      ', ptr=' + this.ptr + ', bytes.length=' + this.getNumBytesLeft();
    }

    const result = new Uint8Array(num);
    let curPage = this.bytes;
    let ptr = this.ptr;
    let bytesLeftToCopy = num;
    let pageIndex = 0;
    while (bytesLeftToCopy > 0) {
      const bytesLeftInPage = curPage.length - ptr;
      const sourceLength = Math.min(bytesLeftToCopy, bytesLeftInPage);

      result.set(curPage.subarray(ptr, ptr + sourceLength), num - bytesLeftToCopy);

      ptr += sourceLength;
      if (ptr >= curPage.length) {
        curPage = this.pages_[pageIndex++];
        ptr = 0;
      }

      bytesLeftToCopy -= sourceLength;
    }

    if (movePointers) {
      this.movePointer_(num);
    }

    return result;
  }

  /**
   * Reads the next n bytes as a sub-array.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @returns {Uint8Array} The subarray.
   */
  readBytes(n) {
    return this.peekBytes(n, true);
  }

  /**
   * Peeks at the next n bytes as an ASCII string but does not advance the pointer.
   * @param {number} n The number of bytes to peek at.  Must be a positive integer.
   * @returns {string} The next n bytes as a string.
   */
  peekString(n) {
    const num = parseInt(n, 10);
    if (n !== num || num < 0) {
      throw 'Error!  Called peekString() with a non-positive integer';
    } else if (num === 0) {
      return '';
    }

    const totalBytesLeft = this.getNumBytesLeft();
    if (num > totalBytesLeft) {
      throw 'Error!  Overflowed the byte stream while peekString()! n=' + num +
      ', ptr=' + this.ptr + ', bytes.length=' + this.getNumBytesLeft();
    }

    let result = new Array(num);
    let curPage = this.bytes;
    let pageIndex = 0;
    let ptr = this.ptr;
    for (let i = 0; i < num; ++i) {
      result[i] = String.fromCharCode(curPage[ptr++]);
      if (ptr >= curPage.length) {
        curPage = this.pages_[pageIndex++];
        ptr = 0;
      }
    }

    return result.join('');
  }

  /**
   * Returns the next n bytes as an ASCII string and advances the stream pointer
   * n bytes.
   * @param {number} n The number of bytes to read.  Must be a positive integer.
   * @returns {string} The next n bytes as a string.
   */
  readString(n) {
    const strToReturn = this.peekString(n);
    this.movePointer_(n);
    return strToReturn;
  }

  /**
   * Skips n bytes in the stream.
   * @param {number} n The number of bytes to skip. Must be a positive integer.
   * @returns {ByteStream} Returns this ByteStream for chaining.
   */
  skip(n) {
    const num = parseInt(n, 10);
    if (n !== num || num < 0) {
      throw 'Error!  Called skip() with a non-positive integer';
    } else if (num === 0) {
      return this;
    }

    const totalBytesLeft = this.getNumBytesLeft();
    if (num > totalBytesLeft) {
      throw 'Error!  Overflowed the byte stream while skip()! n=' + num +
      ', ptr=' + this.ptr + ', bytes.length=' + this.getNumBytesLeft();
    }

    this.movePointer_(n);
    return this;
  }

  /**
   * Feeds more bytes into the back of the stream.
   * @param {ArrayBuffer} ab
   */
  push(ab) {
    if (!(ab instanceof ArrayBuffer)) {
      throw 'Error! ByteStream.push() called with an invalid ArrayBuffer object';
    }

    this.pages_.push(new Uint8Array(ab));
    // If the pointer is at the end of the current page of bytes, this will advance
    // to the next page.
    this.movePointer_(0);
  }

  /**
   * Creates a new ByteStream from this ByteStream that can be read / peeked.
   * Note that the teed stream is a disconnected copy. If you push more bytes to the original
   * stream, the copy does not get them.
   * TODO: Assess whether the above causes more bugs than it avoids. (It would feel weird to me if
   *       the teed stream shared some state with the original stream.)
   * @returns {ByteStream} A clone of this ByteStream.
   */
  tee() {
    const clone = new ByteStream(this.bytes.buffer);
    clone.bytes = this.bytes;
    clone.ptr = this.ptr;
    clone.pages_ = this.pages_.slice();
    clone.bytesRead_ = this.bytesRead_;
    clone.littleEndian_ = this.littleEndian_;
    return clone;
  }
}

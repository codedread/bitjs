/*
 * bitstream.js
 *
 * Provides readers for bitstreams.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

var bitjs = bitjs || {};
bitjs.io = bitjs.io || {};


// TODO: Add method for tee-ing off the stream with tests.
/**
 * This object allows you to peek and consume bits and bytes out of a stream.
 * More bits can be pushed into the back of the stream via the push() method.
 */
bitjs.io.BitStream = class {
  /**
   * @param {ArrayBuffer} ab An ArrayBuffer object or a Uint8Array.
   * @param {boolean} rtl Whether the stream reads bits from the byte starting
   *     from bit 7 to 0 (true) or bit 0 to 7 (false).
   * @param {Number} opt_offset The offset into the ArrayBuffer
   * @param {Number} opt_length The length of this BitStream
   */
  constructor(ab, rtl, opt_offset, opt_length) {
    if (!(ab instanceof ArrayBuffer)) {
      throw 'Error! BitArray constructed with an invalid ArrayBuffer object';
    }

    const offset = opt_offset || 0;
    const length = opt_length || ab.byteLength;
    this.bytes = new Uint8Array(ab, offset, length);
    this.pages_ = [];
    this.bytePtr = 0; // tracks which byte we are on
    this.bitPtr = 0; // tracks which bit we are on (can have values 0 through 7)
    this.peekBits = rtl ? this.peekBits_rtl : this.peekBits_ltr;
  }


  /**
   * Returns how many bytes are currently in the stream left to be read.
   * @private
   */
  getNumBitsLeft_() {
    const bitsLeftInByte = 8 - this.bitPtr;
    const bitsLeftInCurrentPage = (this.bytes.byteLength - this.bytePtr - 1) * 8 + bitsLeftInByte;
    return this.pages_.reduce((acc, arr) => acc + arr.length * 8, bitsLeftInCurrentPage);
  }

  /**
   * Move the pointer ahead n bits.  The bytePtr and current page are updated as needed.
   * This is a private method, no validation is done.
   * @param {number} n Number of bits to increment.
   * @private
   */
  movePointer_(n) {
    this.bitPtr += n;
    while (this.bitPtr >= 8) {
      this.bitPtr -= 8;
      this.bytePtr++;
      while (this.bytePtr >= this.bytes.length && this.pages_.length > 0) {
        this.bytePtr -= this.bytes.length;
        this.bytes = this.pages_.shift();
      }
    }
  }

  /**
   *   byte0      byte1      byte2      byte3
   * 7......0 | 7......0 | 7......0 | 7......0
   *
   * The bit pointer starts at bit0 of byte0 and moves left until it reaches
   * bit7 of byte0, then jumps to bit0 of byte1, etc.
   * @param {number} n The number of bits to peek, must be a positive integer.
   * @param {boolean=} movePointers Whether to move the pointer, defaults false.
   * @return {number} The peeked bits, as an unsigned number.
   */
  peekBits_ltr(n, opt_movePointers) {
    const NUM = parseInt(n, 10);
    let num = NUM;
    if (n !== num || num < 0) {
      throw 'Error!  Called peekBits_ltr() with a non-positive integer';
    } else if (num === 0) {
      return 0;
    }

    if (num > this.getNumBitsLeft_()) {
      throw 'Error!  Overflowed the bit stream! n=' + n + ', bytePtr=' + bytePtr +
          ', bytes.length=' + bytes.length + ', bitPtr=' + bitPtr;
    }

    const movePointers = opt_movePointers || false;
    let curPage = this.bytes;
    let pageIndex = 0;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;
    let result = 0;
    let bitsIn = 0;

    // keep going until we have no more bits left to peek at
    while (num > 0) {
      if (bytePtr >= curPage.length && this.pages_.length > 0) {
        curPage = this.pages_[pageIndex++];
        bytePtr = 0;
      }

      const numBitsLeftInThisByte = (8 - bitPtr);
      if (num >= numBitsLeftInThisByte) {
        const mask = (bitjs.io.BitStream.BITMASK[numBitsLeftInThisByte] << bitPtr);
        result |= (((curPage[bytePtr] & mask) >> bitPtr) << bitsIn);

        bytePtr++;
        bitPtr = 0;
        bitsIn += numBitsLeftInThisByte;
        num -= numBitsLeftInThisByte;
      } else {
        const mask = (bitjs.io.BitStream.BITMASK[num] << bitPtr);
        result |= (((curPage[bytePtr] & mask) >> bitPtr) << bitsIn);

        bitPtr += num;
        bitsIn += num;
        num = 0;
      }
    }

    if (movePointers) {
      this.movePointer_(NUM);
    }

    return result;
  }

  /**
   *   byte0      byte1      byte2      byte3
   * 7......0 | 7......0 | 7......0 | 7......0
   *
   * The bit pointer starts at bit7 of byte0 and moves right until it reaches
   * bit0 of byte0, then goes to bit7 of byte1, etc.
   * @param {number} n The number of bits to peek.  Must be a positive integer.
   * @param {boolean=} movePointers Whether to move the pointer, defaults false.
   * @return {number} The peeked bits, as an unsigned number.
   */
  peekBits_rtl(n, opt_movePointers) {
    const NUM = parseInt(n, 10);
    let num = NUM;
    if (n !== num || num < 0) {
      throw 'Error!  Called peekBits_rtl() with a non-positive integer';
    } else if (num === 0) {
      return 0;
    }

    if (num > this.getNumBitsLeft_()) {
      throw 'Error!  Overflowed the bit stream! n=' + n + ', bytePtr=' + bytePtr +
          ', bytes.length=' + bytes.length + ', bitPtr=' + bitPtr;
    }

    const movePointers = opt_movePointers || false;
    let curPage = this.bytes;
    let pageIndex = 0;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;
    let result = 0;

    // keep going until we have no more bits left to peek at
    while (num > 0) {
      if (bytePtr >= curPage.length && this.pages_.length > 0) {
        curPage = this.pages_[pageIndex++];
        bytePtr = 0;
      }

      const numBitsLeftInThisByte = (8 - bitPtr);
      if (num >= numBitsLeftInThisByte) {
        result <<= numBitsLeftInThisByte;
        result |= (bitjs.io.BitStream.BITMASK[numBitsLeftInThisByte] & curPage[bytePtr]);
        bytePtr++;
        bitPtr = 0;
        num -= numBitsLeftInThisByte;
      } else {
        result <<= num;
        const numBits = 8 - num - bitPtr;
        result |= ((curPage[bytePtr] & (bitjs.io.BitStream.BITMASK[num] << numBits)) >> numBits);

        bitPtr += num;
        num = 0;
      }
    }

    if (movePointers) {
      this.movePointer_(NUM);
    }

    return result;
  }

  /**
   * Peek at 16 bits from current position in the buffer.
   * Bit at (bytePtr,bitPtr) has the highest position in returning data.
   * Taken from getbits.hpp in unrar.
   * TODO: Move this out of BitStream and into unrar.
   */
  getBits() {
    return (((((this.bytes[this.bytePtr] & 0xff) << 16) +
                ((this.bytes[this.bytePtr+1] & 0xff) << 8) +
                ((this.bytes[this.bytePtr+2] & 0xff))) >>> (8-this.bitPtr)) & 0xffff);
  }

  /**
   * Reads n bits out of the stream, consuming them (moving the bit pointer).
   * @param {number} n The number of bits to read.  Must be a positive integer.
   * @return {number} The read bits, as an unsigned number.
   */
  readBits(n) {
    return this.peekBits(n, true);
  }

  /**
   * This returns n bytes as a sub-array, advancing the pointer if movePointers
   * is true.  Only use this for uncompressed blocks as this throws away remaining
   * bits in the current byte.
   * @param {number} n The number of bytes to peek.  Must be a positive integer.
   * @param {boolean=} movePointers Whether to move the pointer, defaults false.
   * @return {Uint8Array} The subarray.
   */
  peekBytes(n, opt_movePointers) {
    const num = parseInt(n, 10);
    if (n !== num || num < 0) {
      throw 'Error!  Called peekBytes() with a non-positive integer';
    } else if (num === 0) {
      return new Uint8Array();
    }

    // Flush bits until we are byte-aligned.
    // from http://tools.ietf.org/html/rfc1951#page-11
    // "Any bits of input up to the next byte boundary are ignored."
    while (this.bitPtr != 0) {
      this.readBits(1);
    }

    const numBytesLeft = this.getNumBitsLeft_() / 8;
    if (num > numBytesLeft) {
      throw 'Error!  Overflowed the bit stream! n=' + num + ', bytePtr=' + this.bytePtr +
          ', bytes.length=' + this.bytes.length + ', bitPtr=' + this.bitPtr;
    }

    const movePointers = opt_movePointers || false;
    const result = new Uint8Array(num);
    let curPage = this.bytes;
    let pageIndex = 0;
    let bytePtr = this.bytePtr;
    for (let i = 0; i < num; ++i) {
      result[i] = curPage[bytePtr++];
      if (bytePtr >= curPage.length) {
        curPage = this.pages_[pageIndex++];
        bytePtr = 0;
      }
    }

    if (movePointers) {
      this.bytePtr += num;
    }

    return result;
  }

  /**
   * @param {number} n The number of bytes to read.
   * @return {Uint8Array} The subarray.
   */
  readBytes(n) {
    return this.peekBytes(n, true);
  }

  /**
   * Feeds more bytes into the back of the stream.
   * @param {ArrayBuffer} ab 
   */
  push(ab) {
    if (!(ab instanceof ArrayBuffer)) {
      throw 'Error! BitStream.push() called with an invalid ArrayBuffer object';
    }

    this.pages_.push(new Uint8Array(ab));
  }

  /**
   * Creates a new BitStream from this BitStream that can be read / peeked.
   * @return {BitStream} A clone of this BitStream.
   */
  tee() {
    const clone = new BitStream(this.bytes.buffer);
    clone.bytes = this.bytes;
    clone.pages_ = this.pages_.slice();
    clone.bytePtr = this.bytePtr;
    clone.bitPtr = this.bitPtr;
    clone.peekBits = this.peekBits;
    return clone;
  }
}

// mask for getting N number of bits (0-8)
bitjs.io.BitStream.BITMASK = [0, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF ];

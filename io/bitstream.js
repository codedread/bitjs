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


// TODO: Add method for pushing bits (multiple arrays) and have tests.
// TODO: Add method for tee-ing off the stream with tests.
/**
 * This bit stream peeks and consumes bits out of a binary stream.
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
    this.bytePtr = 0; // tracks which byte we are on
    this.bitPtr = 0; // tracks which bit we are on (can have values 0 through 7)
    this.peekBits = rtl ? this.peekBits_rtl : this.peekBits_ltr;
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
    let num = parseInt(n, 10);
    if (n !== num || num <= 0) {
      throw 'Error!  Called peekBits_ltr() with a non-positive integer';
    }

    const movePointers = opt_movePointers || false;
    const bytes = this.bytes;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;
    let result = 0;
    let bitsIn = 0;

    // keep going until we have no more bits left to peek at
    // TODO: Consider putting all bits from bytes we will need into a variable and then
    //       shifting/masking it to just extract the bits we want.
    //       This could be considerably faster when reading more than 3 or 4 bits at a time.
    while (num > 0) {
      if (bytePtr >= bytes.length) {
        throw 'Error!  Overflowed the bit stream! n=' + n + ', bytePtr=' + bytePtr + ', bytes.length=' +
          bytes.length + ', bitPtr=' + bitPtr;
      }

      const numBitsLeftInThisByte = (8 - bitPtr);
      if (num >= numBitsLeftInThisByte) {
        const mask = (bitjs.io.BitStream.BITMASK[numBitsLeftInThisByte] << bitPtr);
        result |= (((bytes[bytePtr] & mask) >> bitPtr) << bitsIn);

        bytePtr++;
        bitPtr = 0;
        bitsIn += numBitsLeftInThisByte;
        num -= numBitsLeftInThisByte;
      }
      else {
        const mask = (bitjs.io.BitStream.BITMASK[num] << bitPtr);
        result |= (((bytes[bytePtr] & mask) >> bitPtr) << bitsIn);

        bitPtr += num;
        bitsIn += num;
        num = 0;
      }
    }

    if (movePointers) {
      this.bitPtr = bitPtr;
      this.bytePtr = bytePtr;
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
    let num = parseInt(n, 10);
    if (n !== num || num <= 0) {
      throw 'Error!  Called peekBits_rtl() with a non-positive integer';
    }

    const movePointers = opt_movePointers || false;
    const bytes = this.bytes;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;
    let result = 0;

    // keep going until we have no more bits left to peek at
    // TODO: Consider putting all bits from bytes we will need into a variable and then
    //       shifting/masking it to just extract the bits we want.
    //       This could be considerably faster when reading more than 3 or 4 bits at a time.
    while (num > 0) {
      if (bytePtr >= bytes.length) {
        throw 'Error!  Overflowed the bit stream! n=' + n + ', bytePtr=' + bytePtr + ', bytes.length=' +
          bytes.length + ', bitPtr=' + bitPtr;
      }

      const numBitsLeftInThisByte = (8 - bitPtr);
      if (num >= numBitsLeftInThisByte) {
        result <<= numBitsLeftInThisByte;
        result |= (bitjs.io.BitStream.BITMASK[numBitsLeftInThisByte] & bytes[bytePtr]);
        bytePtr++;
        bitPtr = 0;
        num -= numBitsLeftInThisByte;
      }
      else {
        result <<= num;
        const numBits = 8 - num - bitPtr;
        result |= ((bytes[bytePtr] & (bitjs.io.BitStream.BITMASK[num] << numBits)) >> numBits);

        bitPtr += num;
        num = 0;
      }
    }

    if (movePointers) {
      this.bitPtr = bitPtr;
      this.bytePtr = bytePtr;
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
    if (n !== num || num <= 0) {
      throw 'Error!  Called peekBytes() with a non-positive integer';
    }

    // Flush bits until we are byte-aligned.
    // from http://tools.ietf.org/html/rfc1951#page-11
    // "Any bits of input up to the next byte boundary are ignored."
    while (this.bitPtr != 0) {
      this.readBits(1);
    }

    if (this.bytePtr + num > this.bytes.byteLength) {
      throw 'Error!  Overflowed the bit stream! n=' + num + ', bytePtr=' + this.bytePtr +
          ', bytes.length=' + this.bytes.length + ', bitPtr=' + this.bitPtr;
    }

    const result = this.bytes.subarray(this.bytePtr, this.bytePtr + num);

    const movePointers = opt_movePointers || false;
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
}

// mask for getting N number of bits (0-8)
bitjs.io.BitStream.BITMASK = [0, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF ];


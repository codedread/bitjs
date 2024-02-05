/**
 * This object allows you to peek and consume bits and bytes out of a stream.
 * Note that this stream is optimized, and thus, will *NOT* throw an error if
 * the end of the stream is reached.  Only use this in scenarios where you
 * already have all the bits you need.
 *
 * Bit reading always proceeds from the first byte in the buffer, to the
 * second byte, and so on. The MTL flag controls which bit is considered
 * first *inside* the byte. The default is least-to-most direction.
 *
 * An Example for how Most-To-Least vs Least-to-Most mode works:
 *
 * If you have an ArrayBuffer with the following two Uint8s:
 * 185 (0b10111001) and 66 (0b01000010)
 * and you perform a series of readBits: 2 bits, then 3, then 5, then 6.
 *
 * A BitStream in "mtl" mode will yield the following:
 * - readBits(2) => 2 ('10')
 * - readBits(3) => 7 ('111')
 * - readBits(5) => 5 ('00101')
 * - readBits(6) => 2 ('000010')
 *
 * A BitStream in "ltm" mode will yield the following:
 * - readBits(2) => 1 ('01')
 * - readBits(3) => 6 ('110')
 * - readBits(5) => 21 ('10101')
 * - readBits(6) => 16 ('010000')
 */
export class BitStream {
    /**
     * @param {ArrayBuffer} ab An ArrayBuffer object.
     * @param {boolean} mtl Whether the stream reads bits from the byte starting with the
     *     most-significant-bit (bit 7) to least-significant (bit 0). False means the direction is
     *     from least-significant-bit (bit 0) to most-significant (bit 7).
     * @param {Number} opt_offset The offset into the ArrayBuffer
     * @param {Number} opt_length The length of this BitStream
     */
    constructor(ab: ArrayBuffer, mtl: boolean, opt_offset: number, opt_length: number);
    /**
     * The bytes in the stream.
     * @type {Uint8Array}
     * @private
     */
    private bytes;
    /**
     * The byte in the stream that we are currently on.
     * @type {Number}
     * @private
     */
    private bytePtr;
    /**
     * The bit in the current byte that we will read next (can have values 0 through 7).
     * @type {Number}
     * @private
     */
    private bitPtr;
    /**
     * An ever-increasing number.
     * @type {Number}
     * @private
     */
    private bitsRead_;
    peekBits: (n: number, opt_movePointers: any) => number;
    /**
     * Returns how many bits have been read in the stream since the beginning of time.
     * @returns {number}
     */
    getNumBitsRead(): number;
    /**
     * Returns how many bits are currently in the stream left to be read.
     * @returns {number}
     */
    getNumBitsLeft(): number;
    /**
     *   byte0      byte1      byte2      byte3
     * 7......0 | 7......0 | 7......0 | 7......0
     *
     * The bit pointer starts at least-significant bit (0) of byte0 and moves left until it reaches
     * bit7 of byte0, then jumps to bit0 of byte1, etc.
     * @param {number} n The number of bits to peek, must be a positive integer.
     * @param {boolean=} movePointers Whether to move the pointer, defaults false.
     * @returns {number} The peeked bits, as an unsigned number.
     */
    peekBits_ltm(n: number, opt_movePointers: any): number;
    /**
     *   byte0      byte1      byte2      byte3
     * 7......0 | 7......0 | 7......0 | 7......0
     *
     * The bit pointer starts at bit7 of byte0 and moves right until it reaches
     * bit0 of byte0, then goes to bit7 of byte1, etc.
     * @param {number} n The number of bits to peek.  Must be a positive integer.
     * @param {boolean=} movePointers Whether to move the pointer, defaults false.
     * @returns {number} The peeked bits, as an unsigned number.
     */
    peekBits_mtl(n: number, opt_movePointers: any): number;
    /**
     * Peek at 16 bits from current position in the buffer.
     * Bit at (bytePtr,bitPtr) has the highest position in returning data.
     * Taken from getbits.hpp in unrar.
     * TODO: Move this out of BitStream and into unrar.
     * @returns {number}
     */
    getBits(): number;
    /**
     * Reads n bits out of the stream, consuming them (moving the bit pointer).
     * @param {number} n The number of bits to read.  Must be a positive integer.
     * @returns {number} The read bits, as an unsigned number.
     */
    readBits(n: number): number;
    /**
     * This returns n bytes as a sub-array, advancing the pointer if movePointers
     * is true.  Only use this for uncompressed blocks as this throws away remaining
     * bits in the current byte.
     * @param {number} n The number of bytes to peek.  Must be a positive integer.
     * @param {boolean=} movePointers Whether to move the pointer, defaults false.
     * @returns {Uint8Array} The subarray.
     */
    peekBytes(n: number, opt_movePointers: any): Uint8Array;
    /**
     * @param {number} n The number of bytes to read.
     * @returns {Uint8Array} The subarray.
     */
    readBytes(n: number): Uint8Array;
    /**
     * Skips n bits in the stream. Will throw an error if n is < 0 or greater than the number of
     * bits left in the stream.
     * @param {number} n The number of bits to skip. Must be a positive integer.
     * @returns {BitStream} Returns this BitStream for chaining.
     */
    skip(n: number): BitStream;
}
//# sourceMappingURL=bitstream.d.ts.map
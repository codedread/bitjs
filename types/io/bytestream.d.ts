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
    constructor(ab: ArrayBuffer, opt_offset?: number | undefined, opt_length?: number | undefined);
    /**
     * The current page of bytes in the stream.
     * @type {Uint8Array}
     * @private
     */
    private bytes;
    /**
     * The next pages of bytes in the stream.
     * @type {Array<Uint8Array>}
     * @private
     */
    private pages_;
    /**
     * The byte in the current page that we will read next.
     * @type {Number}
     * @private
     */
    private ptr;
    /**
     * An ever-increasing number.
     * @type {Number}
     * @private
     */
    private bytesRead_;
    /**
     * Whether the stream is little-endian (true) or big-endian (false).
     * @type {boolean}
     * @private
     */
    private littleEndian_;
    /** @returns {boolean} Whether the stream is little-endian (least significant byte is first). */
    isLittleEndian(): boolean;
    /**
     * Big-Endian means the most significant byte is first. it is sometimes called Motorola-style.
     * @param {boolean=} val The value to set. If not present, the stream is set to big-endian.
     */
    setBigEndian(val?: boolean | undefined): void;
    /**
     * Little-Endian means the least significant byte is ifrst. is sometimes called Intel-style.
     * @param {boolean=} val The value to set. If not present, the stream is set to little-endian.
     */
    setLittleEndian(val?: boolean | undefined): void;
    /**
     * Returns how many bytes have been consumed (read or skipped) since the beginning of time.
     * @returns {number}
     */
    getNumBytesRead(): number;
    /**
     * Returns how many bytes are currently in the stream left to be read.
     * @returns {number}
     */
    getNumBytesLeft(): number;
    /**
     * Move the pointer ahead n bytes.  If the pointer is at the end of the current array
     * of bytes and we have another page of bytes, point at the new page.  This is a private
     * method, no validation is done.
     * @param {number} n Number of bytes to increment.
     * @private
     */
    private movePointer_;
    /**
     * Peeks at the next n bytes as an unsigned number but does not advance the
     * pointer.
     * @param {number} n The number of bytes to peek at.  Must be a positive integer.
     * @returns {number} The n bytes interpreted as an unsigned number.
     */
    peekNumber(n: number): number;
    /**
     * Returns the next n bytes as an unsigned number (or -1 on error)
     * and advances the stream pointer n bytes.
     * @param {number} n The number of bytes to read.  Must be a positive integer.
     * @returns {number} The n bytes interpreted as an unsigned number.
     */
    readNumber(n: number): number;
    /**
     * Returns the next n bytes as a signed number but does not advance the
     * pointer.
     * @param {number} n The number of bytes to read.  Must be a positive integer.
     * @returns {number} The bytes interpreted as a signed number.
     */
    peekSignedNumber(n: number): number;
    /**
     * Returns the next n bytes as a signed number and advances the stream pointer.
     * @param {number} n The number of bytes to read.  Must be a positive integer.
     * @returns {number} The bytes interpreted as a signed number.
     */
    readSignedNumber(n: number): number;
    /**
     * This returns n bytes as a sub-array, advancing the pointer if movePointers
     * is true.
     * @param {number} n The number of bytes to read.  Must be a positive integer.
     * @param {boolean} movePointers Whether to move the pointers.
     * @returns {Uint8Array} The subarray.
     */
    peekBytes(n: number, movePointers: boolean): Uint8Array;
    /**
     * Reads the next n bytes as a sub-array.
     * @param {number} n The number of bytes to read.  Must be a positive integer.
     * @returns {Uint8Array} The subarray.
     */
    readBytes(n: number): Uint8Array;
    /**
     * Peeks at the next n bytes as an ASCII string but does not advance the pointer.
     * @param {number} n The number of bytes to peek at.  Must be a positive integer.
     * @returns {string} The next n bytes as a string.
     */
    peekString(n: number): string;
    /**
     * Returns the next n bytes as an ASCII string and advances the stream pointer
     * n bytes.
     * @param {number} n The number of bytes to read.  Must be a positive integer.
     * @returns {string} The next n bytes as a string.
     */
    readString(n: number): string;
    /**
     * Skips n bytes in the stream.
     * @param {number} n The number of bytes to skip. Must be a positive integer.
     * @returns {ByteStream} Returns this ByteStream for chaining.
     */
    skip(n: number): ByteStream;
    /**
     * Feeds more bytes into the back of the stream.
     * @param {ArrayBuffer} ab
     */
    push(ab: ArrayBuffer): void;
    /**
     * Creates a new ByteStream from this ByteStream that can be read / peeked.
     * Note that the teed stream is a disconnected copy. If you push more bytes to the original
     * stream, the copy does not get them.
     * TODO: Assess whether the above causes more bugs than it avoids. (It would feel weird to me if
     *       the teed stream shared some state with the original stream.)
     * @returns {ByteStream} A clone of this ByteStream.
     */
    tee(): ByteStream;
}
//# sourceMappingURL=bytestream.d.ts.map
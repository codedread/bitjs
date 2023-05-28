/**
 * A write-only Bit buffer which uses a Uint8Array as a backing store.
 */
export class BitBuffer {
    /**
     * @param {number} numBytes The number of bytes to allocate.
     * @param {boolean} mtl The bit-packing mode. True means pack bits from most-significant (7) to
     *     least-significant (0). Defaults false: least-significant (0) to most-significant (8).
     */
    constructor(numBytes: number, mtl?: boolean);
    /**
     * @type {Uint8Array}
     * @public
     */
    public data: Uint8Array;
    /**
     * Whether we pack bits from most-significant-bit to least. Defaults false (least-to-most
     * significant bit packing).
     * @type {boolean}
     * @private
     */
    private mtl;
    /**
     * The current byte we are filling with bits.
     * @type {number}
     * @public
     */
    public bytePtr: number;
    /**
     * Points at the bit within the current byte where the next bit will go. This number ranges
     * from 0 to 7 and the direction of packing is indicated by the mtl property.
     * @type {number}
     * @public
     */
    public bitPtr: number;
    /** @returns {boolean} */
    getPackingDirection(): boolean;
    /**
     * Sets the bit-packing direction. Default (false) is least-significant-bit (0) to
     * most-significant (7). Changing the bit-packing direction when the bit pointer is in the
     * middle of a byte will fill the rest of that byte with 0s using the current bit-packing
     * direction and then set the bit pointer to the appropriate bit of the next byte. If there
     * are no more bytes left in this buffer, it will throw an error.
     */
    setPackingDirection(mtl?: boolean): void;
    /**
     * writeBits(3, 6) is the same as writeBits(0b000011, 6).
     * Will throw an error (without writing) if this would over-flow the buffer.
     * @param {number} val The bits to pack into the buffer. Negative values are not allowed.
     * @param {number} numBits Must be positive, non-zero and less or equal to than 53, since
     *     JavaScript can only support 53-bit integers.
     */
    writeBits(val: number, numBits: number): void;
}
//# sourceMappingURL=bitbuffer.d.ts.map
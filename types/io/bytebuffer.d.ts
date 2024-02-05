/**
 * A write-only Byte buffer which uses a Uint8 Typed Array as a backing store.
 */
export class ByteBuffer {
    /**
     * @param {number} numBytes The number of bytes to allocate.
     */
    constructor(numBytes: number);
    /**
     * @type {Uint8Array}
     * @public
     */
    public data: Uint8Array;
    /**
     * Points to the byte that will next be written.
     * @type {number}
     * @public
     */
    public ptr: number;
    /**
     * Returns an exact copy of all the data that has been written to the ByteBuffer.
     * @returns {Uint8Array}
     */
    getData(): Uint8Array;
    /**
     * @param {number} b The byte to insert.
     */
    insertByte(b: number): void;
    /**
     * @param {Array.<number>|Uint8Array|Int8Array} bytes The bytes to insert.
     */
    insertBytes(bytes: Array<number> | Uint8Array | Int8Array): void;
    /**
     * Writes an unsigned number into the next n bytes.  If the number is too large
     * to fit into n bytes or is negative, an error is thrown.
     * @param {number} num The unsigned number to write.
     * @param {number} numBytes The number of bytes to write the number into.
     */
    writeNumber(num: number, numBytes: number): void;
    /**
     * Writes a signed number into the next n bytes.  If the number is too large
     * to fit into n bytes, an error is thrown.
     * @param {number} num The signed number to write.
     * @param {number} numBytes The number of bytes to write the number into.
     */
    writeSignedNumber(num: number, numBytes: number): void;
    /**
     * @param {string} str The ASCII string to write.
     */
    writeASCIIString(str: string): void;
}
//# sourceMappingURL=bytebuffer.d.ts.map
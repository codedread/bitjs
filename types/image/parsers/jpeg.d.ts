export type JpegParseEventType = string;
export namespace JpegParseEventType {
    const APP0_MARKER: string;
    const APP0_EXTENSION: string;
    const APP1_EXIF: string;
    const DEFINE_QUANTIZATION_TABLE: string;
    const DEFINE_HUFFMAN_TABLE: string;
    const START_OF_FRAME: string;
    const START_OF_SCAN: string;
}
export type JpegSegmentType = number;
export namespace JpegSegmentType {
    const SOF0: number;
    const SOF1: number;
    const SOF2: number;
    const DHT: number;
    const SOI: number;
    const EOI: number;
    const SOS: number;
    const DQT: number;
    const APP0: number;
    const APP1: number;
}
export type JpegDensityUnits = number;
export namespace JpegDensityUnits {
    const NO_UNITS: number;
    const PIXELS_PER_INCH: number;
    const PIXELS_PER_CM: number;
}
/**
 * @typedef JpegApp0Marker
 * @property {string} jfifVersion Like '1.02'.
 * @property {JpegDensityUnits} densityUnits
 * @property {number} xDensity
 * @property {number} yDensity
 * @property {number} xThumbnail
 * @property {number} yThumbnail
 * @property {Uint8Array} thumbnailData RGB data. Size is 3 x thumbnailWidth x thumbnailHeight.
 */
export class JpegApp0MarkerEvent extends Event {
    /** @param {JpegApp0Marker} */
    constructor(segment: any);
    /** @type {JpegApp0Marker} */
    app0Marker: JpegApp0Marker;
}
export type JpegExtensionThumbnailFormat = number;
export namespace JpegExtensionThumbnailFormat {
    const JPEG: number;
    const ONE_BYTE_PER_PIXEL_PALETTIZED: number;
    const THREE_BYTES_PER_PIXEL_RGB: number;
}
/**
 * @typedef JpegApp0Extension
 * @property {JpegExtensionThumbnailFormat} thumbnailFormat
 * @property {Uint8Array} thumbnailData Raw thumbnail data
 */
export class JpegApp0ExtensionEvent extends Event {
    /** @param {JpegApp0Extension} */
    constructor(segment: any);
    /** @type {JpegApp0Extension} */
    app0Extension: JpegApp0Extension;
}
export class JpegApp1ExifEvent extends Event {
    /** @param {Map<number, ExifValue>} exifValueMap */
    constructor(exifValueMap: Map<number, import("./exif.js").ExifValue>);
    /** @type {Map<number, ExifValue>} */
    exifValueMap: Map<number, import("./exif.js").ExifValue>;
}
/**
 * @typedef JpegDefineQuantizationTable
 * @property {number} tableNumber Table/component number.
 * @property {number} precision (0=byte, 1=word).
 * @property {number[]} tableValues 64 numbers representing the quantization table.
 */
export class JpegDefineQuantizationTableEvent extends Event {
    /** @param {JpegDefineQuantizationTable} table */
    constructor(table: JpegDefineQuantizationTable);
    /** @type {JpegDefineQuantizationTable} */
    quantizationTable: JpegDefineQuantizationTable;
}
export type JpegHuffmanTableType = number;
export namespace JpegHuffmanTableType {
    const DC: number;
    const AC: number;
}
/**
 * @typedef JpegDefineHuffmanTable
 * @property {number} tableNumber Table/component number (0-3).
 * @property {JpegHuffmanTableType} tableType Either DC or AC.
 * @property {number[]} numberOfSymbols A 16-byte array specifying the # of symbols of each length.
 * @property {number[]} symbols
 */
export class JpegDefineHuffmanTableEvent extends Event {
    /** @param {JpegDefineHuffmanTable} table */
    constructor(table: JpegDefineHuffmanTable);
    /** @type {JpegDefineHuffmanTable} */
    huffmanTable: JpegDefineHuffmanTable;
}
export type JpegDctType = number;
export namespace JpegDctType {
    const BASELINE: number;
    const EXTENDED_SEQUENTIAL: number;
    const PROGRESSIVE: number;
}
export type JpegComponentType = number;
export namespace JpegComponentType {
    const Y: number;
    const CB: number;
    const CR: number;
    const I: number;
    const Q: number;
}
/**
 * @typedef JpegComponentDetail
 * @property {JpegComponentType} componentId
 * @property {number} verticalSamplingFactor
 * @property {number} horizontalSamplingFactor
 * @property {number} quantizationTableNumber
 */
/**
 * @typedef JpegStartOfFrame
 * @property {JpegDctType} dctType
 * @property {number} dataPrecision
 * @property {number} imageHeight
 * @property {number} imageWidth
 * @property {number} numberOfComponents Usually 1, 3, or 4.
 * @property {JpegComponentDetail[]} componentDetails
 */
export class JpegStartOfFrameEvent extends Event {
    /** @param {JpegStartOfFrame} sof */
    constructor(sof: JpegStartOfFrame);
    /** @type {JpegStartOfFrame} */
    startOfFrame: JpegStartOfFrame;
}
/**
 * @typedef JpegStartOfScan
 * @property {number} componentsInScan
 * @property {number} componentSelectorY
 * @property {number} huffmanTableSelectorY
 * @property {number} componentSelectorCb
 * @property {number} huffmanTableSelectorCb
 * @property {number} componentSelectorCr
 * @property {number} huffmanTableSelectorCr
 * @property {number} scanStartPositionInBlock
 * @property {number} scanEndPositionInBlock
 * @property {number} successiveApproximationBitPosition
 * @property {Uint8Array} rawImageData
 */
export class JpegStartOfScanEvent extends Event {
    constructor(sos: any);
    /** @type {JpegStartOfScan} */
    sos: JpegStartOfScan;
}
export class JpegParser extends EventTarget {
    /** @param {ArrayBuffer} ab */
    constructor(ab: ArrayBuffer);
    /**
     * @type {ByteStream}
     * @private
     */
    private bstream;
    /**
     * @type {boolean}
     * @private
     */
    private hasApp0MarkerSegment;
    /**
     * Type-safe way to bind a listener for a JpegApp0MarkerEvent.
     * @param {function(JpegApp0MarkerEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onApp0Marker(listener: (arg0: JpegApp0MarkerEvent) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegApp0ExtensionEvent.
     * @param {function(JpegApp0MarkerEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onApp0Extension(listener: (arg0: JpegApp0MarkerEvent) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegApp1ExifEvent.
     * @param {function(JpegApp1ExifEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onApp1Exif(listener: (arg0: JpegApp1ExifEvent) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegDefineQuantizationTableEvent.
     * @param {function(JpegDefineQuantizationTableEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onDefineQuantizationTable(listener: (arg0: JpegDefineQuantizationTableEvent) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegDefineHuffmanTableEvent.
     * @param {function(JpegDefineHuffmanTableEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onDefineHuffmanTable(listener: (arg0: JpegDefineHuffmanTableEvent) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegStartOfFrameEvent.
     * @param {function(JpegStartOfFrameEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onStartOfFrame(listener: (arg0: JpegStartOfFrameEvent) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegStartOfScanEvent.
     * @param {function(JpegStartOfScanEvent): void} listener
     * @returns {JpegParser} for chaining
     */
    onStartOfScan(listener: (arg0: JpegStartOfScanEvent) => void): JpegParser;
    /** @returns {Promise<void>} A Promise that resolves when the parsing is complete. */
    start(): Promise<void>;
    /**
     * Reads an Image File Directory from stream.
     * @param {ByteStream} stream The stream to extract the Exif value descriptor.
     * @param {ByteStream} lookAheadStream The lookahead stream if the offset is used.
     * @param {Map<number, ExifValue} exifValueMap This map to add the Exif values.
     * @returns {number} The next IFD offset.
     */
    readExifIfd(stream: ByteStream, lookAheadStream: ByteStream, exifValueMap: Map<number, import("./exif.js").ExifValue>): number;
}
export type ExifValue = import('./exif.js').ExifValue;
export type JpegApp0Marker = {
    /**
     * Like '1.02'.
     */
    jfifVersion: string;
    densityUnits: JpegDensityUnits;
    xDensity: number;
    yDensity: number;
    xThumbnail: number;
    yThumbnail: number;
    /**
     * RGB data. Size is 3 x thumbnailWidth x thumbnailHeight.
     */
    thumbnailData: Uint8Array;
};
export type JpegApp0Extension = {
    thumbnailFormat: JpegExtensionThumbnailFormat;
    /**
     * Raw thumbnail data
     */
    thumbnailData: Uint8Array;
};
export type JpegDefineQuantizationTable = {
    /**
     * Table/component number.
     */
    tableNumber: number;
    /**
     * (0=byte, 1=word).
     */
    precision: number;
    /**
     * 64 numbers representing the quantization table.
     */
    tableValues: number[];
};
export type JpegDefineHuffmanTable = {
    /**
     * Table/component number (0-3).
     */
    tableNumber: number;
    /**
     * Either DC or AC.
     */
    tableType: JpegHuffmanTableType;
    /**
     * A 16-byte array specifying the # of symbols of each length.
     */
    numberOfSymbols: number[];
    symbols: number[];
};
export type JpegComponentDetail = {
    componentId: JpegComponentType;
    verticalSamplingFactor: number;
    horizontalSamplingFactor: number;
    quantizationTableNumber: number;
};
export type JpegStartOfFrame = {
    dctType: JpegDctType;
    dataPrecision: number;
    imageHeight: number;
    imageWidth: number;
    /**
     * Usually 1, 3, or 4.
     */
    numberOfComponents: number;
    componentDetails: JpegComponentDetail[];
};
export type JpegStartOfScan = {
    componentsInScan: number;
    componentSelectorY: number;
    huffmanTableSelectorY: number;
    componentSelectorCb: number;
    huffmanTableSelectorCb: number;
    componentSelectorCr: number;
    huffmanTableSelectorCr: number;
    scanStartPositionInBlock: number;
    scanEndPositionInBlock: number;
    successiveApproximationBitPosition: number;
    rawImageData: Uint8Array;
};
import { ByteStream } from "../../io/bytestream.js";
//# sourceMappingURL=jpeg.d.ts.map
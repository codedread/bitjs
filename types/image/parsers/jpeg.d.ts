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
export type JpegExtensionThumbnailFormat = number;
export namespace JpegExtensionThumbnailFormat {
    const JPEG: number;
    const ONE_BYTE_PER_PIXEL_PALETTIZED: number;
    const THREE_BYTES_PER_PIXEL_RGB: number;
}
export type JpegHuffmanTableType = number;
export namespace JpegHuffmanTableType {
    const DC: number;
    const AC: number;
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
     * Type-safe way to bind a listener for a JpegApp0Marker.
     * @param {function(CustomEvent<JpegApp0Marker>): void} listener
     * @returns {JpegParser} for chaining
     */
    onApp0Marker(listener: (arg0: CustomEvent<JpegApp0Marker>) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegApp0Extension.
     * @param {function(CustomEvent<JpegApp0Extension>): void} listener
     * @returns {JpegParser} for chaining
     */
    onApp0Extension(listener: (arg0: CustomEvent<JpegApp0Extension>) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegExifProfile.
     * @param {function(CustomEvent<JpegExifProfile>): void} listener
     * @returns {JpegParser} for chaining
     */
    onApp1Exif(listener: (arg0: CustomEvent<JpegExifProfile>) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegDefineQuantizationTable.
     * @param {function(CustomEvent<JpegDefineQuantizationTable>): void} listener
     * @returns {JpegParser} for chaining
     */
    onDefineQuantizationTable(listener: (arg0: CustomEvent<JpegDefineQuantizationTable>) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegDefineHuffmanTable.
     * @param {function(CustomEvent<JpegDefineHuffmanTable>): void} listener
     * @returns {JpegParser} for chaining
     */
    onDefineHuffmanTable(listener: (arg0: CustomEvent<JpegDefineHuffmanTable>) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegStartOfFrame.
     * @param {function(CustomEvent<JpegStartOfFrame>): void} listener
     * @returns {JpegParser} for chaining
     */
    onStartOfFrame(listener: (arg0: CustomEvent<JpegStartOfFrame>) => void): JpegParser;
    /**
     * Type-safe way to bind a listener for a JpegStartOfScan.
     * @param {function(CustomEvent<JpegStartOfScan>): void} listener
     * @returns {JpegParser} for chaining
     */
    onStartOfScan(listener: (arg0: CustomEvent<JpegStartOfScan>) => void): JpegParser;
    /** @returns {Promise<void>} A Promise that resolves when the parsing is complete. */
    start(): Promise<void>;
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
export type JpegExifProfile = Map<number, import("./exif.js").ExifValue>;
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
//# sourceMappingURL=jpeg.d.ts.map
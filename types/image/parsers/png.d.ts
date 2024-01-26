export type PngParseEventType = string;
export namespace PngParseEventType {
    const IDAT: string;
    const IHDR: string;
    const PLTE: string;
    const bKGD: string;
    const cHRM: string;
    const eXIf: string;
    const gAMA: string;
    const hIST: string;
    const iTXt: string;
    const pHYs: string;
    const sBIT: string;
    const sPLT: string;
    const tEXt: string;
    const tIME: string;
    const tRNS: string;
    const zTXt: string;
}
export type PngColorType = number;
export namespace PngColorType {
    const GREYSCALE: number;
    const TRUE_COLOR: number;
    const INDEXED_COLOR: number;
    const GREYSCALE_WITH_ALPHA: number;
    const TRUE_COLOR_WITH_ALPHA: number;
}
export type PngInterlaceMethod = number;
export namespace PngInterlaceMethod {
    const NO_INTERLACE: number;
    const ADAM7_INTERLACE: number;
}
export namespace PngUnitSpecifier {
    const UNKNOWN: number;
    const METRE: number;
}
/**
 * @typedef PngPhysicalPixelDimensions
 * @property {number} pixelPerUnitX
 * @property {number} pixelPerUnitY
 * @property {PngUnitSpecifier} unitSpecifier
 */
/** @typedef {Map<number, ExifValue>} PngExifProfile */
/**
 * @typedef PngHistogram
 * @property {number[]} frequencies The # of frequencies matches the # of palette entries.
 */
/**
 * @typedef PngSuggestedPaletteEntry
 * @property {number} red
 * @property {number} green
 * @property {number} blue
 * @property {number} alpha
 * @property {number} frequency
 */
/**
 * @typedef PngSuggestedPalette
 * @property {string} paletteName
 * @property {number} sampleDepth Either 8 or 16.
 * @property {PngSuggestedPaletteEntry[]} entries
 */
/**
 * @typedef PngChunk Internal use only.
 * @property {number} length
 * @property {string} chunkType
 * @property {ByteStream} chunkStream Do not read more than length!
 * @property {number} crc
 */
export class PngParser extends EventTarget {
    /** @param {ArrayBuffer} ab */
    constructor(ab: ArrayBuffer);
    /**
     * @type {ByteStream}
     * @private
     */
    private bstream;
    /**
     * @type {PngColorType}
     * @private
     */
    private colorType;
    /**
     * @type {PngPalette}
     * @private
     */
    private palette;
    /**
     * Type-safe way to bind a listener for a PngBackgroundColor.
     * @param {function(CustomEvent<PngBackgroundColor>): void} listener
     * @returns {PngParser} for chaining
     */
    onBackgroundColor(listener: (arg0: CustomEvent<PngBackgroundColor>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngChromaticities.
     * @param {function(CustomEvent<PngChromaticities>): void} listener
     * @returns {PngParser} for chaining
     */
    onChromaticities(listener: (arg0: CustomEvent<PngChromaticities>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngCompressedTextualData.
     * @param {function(CustomEvent<PngCompressedTextualData>): void} listener
     * @returns {PngParser} for chaining
     */
    onCompressedTextualData(listener: (arg0: CustomEvent<PngCompressedTextualData>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngExifProfile.
     * @param {function(CustomEvent<PngExifProfile>): void} listener
     * @returns {PngParser} for chaining
     */
    onExifProfile(listener: (arg0: CustomEvent<PngExifProfile>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngImageGamma.
     * @param {function(CustomEvent<number>): void} listener
     * @returns {PngParser} for chaining
     */
    onGamma(listener: (arg0: CustomEvent<number>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngHistogram.
     * @param {function(CustomEvent<PngHistogram>): void} listener
     * @returns {PngParser} for chaining
     */
    onHistogram(listener: (arg0: CustomEvent<PngHistogram>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngImageData.
     * @param {function(CustomEvent<PngImageData>): void} listener
     * @returns {PngParser} for chaining
     */
    onImageData(listener: (arg0: CustomEvent<PngImageData>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngImageHeader.
     * @param {function(CustomEvent<PngImageHeader>): void} listener
     * @returns {PngParser} for chaining
     */
    onImageHeader(listener: (arg0: CustomEvent<PngImageHeader>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngIntlTextualData.
     * @param {function(CustomEvent<PngIntlTextualData>): void} listener
     * @returns {PngParser} for chaining
     */
    onIntlTextualData(listener: (arg0: CustomEvent<PngIntlTextualData>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngLastModTime.
     * @param {function(CustomEvent<PngLastModTime>): void} listener
     * @returns {PngParser} for chaining
     */
    onLastModTime(listener: (arg0: CustomEvent<PngLastModTime>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngPalette.
     * @param {function(CustomEvent<PngPalette>): void} listener
     * @returns {PngParser} for chaining
     */
    onPalette(listener: (arg0: CustomEvent<PngPalette>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngPhysicalPixelDimensions.
     * @param {function(CustomEvent<PngPhysicalPixelDimensions>): void} listener
     * @returns {PngParser} for chaining
     */
    onPhysicalPixelDimensions(listener: (arg0: CustomEvent<PngPhysicalPixelDimensions>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngSignificantBits.
     * @param {function(CustomEvent<PngSignificantBits>): void} listener
     * @returns {PngParser} for chaining
     */
    onSignificantBits(listener: (arg0: CustomEvent<PngSignificantBits>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngSuggestedPalette.
     * @param {function(CustomEvent<PngSuggestedPalette>): void} listener
     * @returns {PngParser} for chaining
     */
    onSuggestedPalette(listener: (arg0: CustomEvent<PngSuggestedPalette>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngTextualData.
     * @param {function(CustomEvent<PngTextualData>): void} listener
     * @returns {PngParser} for chaining
     */
    onTextualData(listener: (arg0: CustomEvent<PngTextualData>) => void): PngParser;
    /**
     * Type-safe way to bind a listener for a PngTransparency.
     * @param {function(CustomEvent<PngTransparency>): void} listener
     * @returns {PngParser} for chaining
     */
    onTransparency(listener: (arg0: CustomEvent<PngTransparency>) => void): PngParser;
    /** @returns {Promise<void>} A Promise that resolves when the parsing is complete. */
    start(): Promise<void>;
}
export type ExifValue = import('./exif.js').ExifValue;
export type PngImageHeader = {
    width: number;
    height: number;
    bitDepth: number;
    colorType: PngColorType;
    compressionMethod: number;
    filterMethod: number;
    interlaceMethod: number;
};
export type PngSignificantBits = {
    /**
     * Populated for color types 0, 4.
     */
    significant_greyscale?: number | undefined;
    /**
     * Populated for color types 2, 3, 6.
     */
    significant_red?: number | undefined;
    /**
     * Populated for color types 2, 3, 6.
     */
    significant_green?: number | undefined;
    /**
     * Populated for color types 2, 3, 6.
     */
    significant_blue?: number | undefined;
    /**
     * Populated for color types 4, 6.
     */
    significant_alpha?: number | undefined;
};
export type PngChromaticities = {
    whitePointX: number;
    whitePointY: number;
    redX: number;
    redY: number;
    greenX: number;
    greenY: number;
    blueX: number;
    blueY: number;
};
export type PngColor = {
    red: number;
    green: number;
    blue: number;
};
export type PngPalette = {
    entries: PngColor[];
};
export type PngTransparency = {
    /**
     * Populated for color type 0.
     */
    greySampleValue?: number | undefined;
    /**
     * Populated for color type 2.
     */
    redSampleValue?: number | undefined;
    /**
     * Populated for color type 2.
     */
    blueSampleValue?: number | undefined;
    /**
     * Populated for color type 2.
     */
    greenSampleValue?: number | undefined;
    /**
     * Populated for color type 3.
     */
    alphaPalette?: number[] | undefined;
};
export type PngImageData = {
    rawImageData: Uint8Array;
};
export type PngTextualData = {
    keyword: string;
    textString?: string | undefined;
};
export type PngCompressedTextualData = {
    keyword: string;
    /**
     * Only value supported is 0 for deflate compression.
     */
    compressionMethod: number;
    compressedText?: Uint8Array | undefined;
};
export type PngIntlTextualData = {
    keyword: string;
    /**
     * 0 for uncompressed, 1 for compressed.
     */
    compressionFlag: number;
    /**
     * 0 means zlib defalt when compressionFlag is 1.
     */
    compressionMethod: number;
    languageTag?: string | undefined;
    translatedKeyword?: string | undefined;
    /**
     * The raw UTF-8 text (may be compressed).
     */
    text: Uint8Array;
};
export type PngBackgroundColor = {
    /**
     * Only for color types 0 and 4.
     */
    greyscale?: number | undefined;
    /**
     * Only for color types 2 and 6.
     */
    red?: number | undefined;
    /**
     * Only for color types 2 and 6.
     */
    green?: number | undefined;
    /**
     * Only for color types 2 and 6.
     */
    blue?: number | undefined;
    /**
     * Only for color type 3.
     */
    paletteIndex?: number | undefined;
};
export type PngLastModTime = {
    /**
     * Four-digit year.
     */
    year: number;
    /**
     * One-based. Value from 1-12.
     */
    month: number;
    /**
     * One-based. Value from 1-31.
     */
    day: number;
    /**
     * Zero-based. Value from 0-23.
     */
    hour: number;
    /**
     * Zero-based. Value from 0-59.
     */
    minute: number;
    /**
     * Zero-based. Value from 0-60 to allow for leap-seconds.
     */
    second: number;
};
export type PngPhysicalPixelDimensions = {
    pixelPerUnitX: number;
    pixelPerUnitY: number;
    unitSpecifier: {
        UNKNOWN: number;
        METRE: number;
    };
};
export type PngExifProfile = Map<number, import("./exif.js").ExifValue>;
export type PngHistogram = {
    /**
     * The # of frequencies matches the # of palette entries.
     */
    frequencies: number[];
};
export type PngSuggestedPaletteEntry = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    frequency: number;
};
export type PngSuggestedPalette = {
    paletteName: string;
    /**
     * Either 8 or 16.
     */
    sampleDepth: number;
    entries: PngSuggestedPaletteEntry[];
};
/**
 * Internal use only.
 */
export type PngChunk = {
    length: number;
    chunkType: string;
    /**
     * Do not read more than length!
     */
    chunkStream: ByteStream;
    crc: number;
};
import { ByteStream } from "../../io/bytestream.js";
//# sourceMappingURL=png.d.ts.map
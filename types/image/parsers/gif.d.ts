export namespace GifParseEventType {
    const APPLICATION_EXTENSION: string;
    const COMMENT_EXTENSION: string;
    const GRAPHIC_CONTROL_EXTENSION: string;
    const HEADER: string;
    const LOGICAL_SCREEN: string;
    const PLAIN_TEXT_EXTENSION: string;
    const TABLE_BASED_IMAGE: string;
    const TRAILER: string;
}
/**
 * @typedef GifHeader
 * @property {string} version
 */
/**
 * @typedef GifColor
 * @property {number} red
 * @property {number} green
 * @property {number} blue
 */
/**
 * @typedef GifLogicalScreen
 * @property {number} logicalScreenWidth
 * @property {number} logicalScreenHeight
 * @property {boolean} globalColorTableFlag
 * @property {number} colorResolution
 * @property {boolean} sortFlag
 * @property {number} globalColorTableSize
 * @property {number} backgroundColorIndex
 * @property {number} pixelAspectRatio
 * @property {GifColor[]=} globalColorTable Only if globalColorTableFlag is true.
 */
/**
 * @typedef GifTableBasedImage
 * @property {number} imageLeftPosition
 * @property {number} imageTopPosition
 * @property {number} imageWidth
 * @property {number} imageHeight
 * @property {boolean} localColorTableFlag
 * @property {boolean} interlaceFlag
 * @property {boolean} sortFlag
 * @property {number} localColorTableSize
 * @property {GifColor[]=} localColorTable Only if localColorTableFlag is true.
 * @property {number} lzwMinimumCodeSize
 * @property {Uint8Array} imageData
 */
/**
 * @typedef GifGraphicControlExtension
 * @property {number} disposalMethod
 * @property {boolean} userInputFlag
 * @property {boolean} transparentColorFlag
 * @property {number} delayTime
 * @property {number} transparentColorIndex
 */
/**
 * @typedef GifCommentExtension
 * @property {string} comment
 */
/**
 * @typedef GifPlainTextExtension
 * @property {number} textGridLeftPosition
 * @property {number} textGridTopPosition
 * @property {number} textGridWidth
 * @property {number} textGridHeight
 * @property {number} characterCellWidth
 * @property {number} characterCellHeight
 * @property {number} textForegroundColorIndex
 * @property {number} textBackgroundColorIndex
 * @property {string} plainText
 */
/**
 * @typedef GifApplicationExtension
 * @property {string} applicationIdentifier
 * @property {Uint8Array} applicationAuthenticationCode
 * @property {Uint8Array} applicationData
 */
/**
 * The Grammar.
 *
 * <GIF Data Stream> ::=     Header <Logical Screen> <Data>* Trailer
 * <Logical Screen> ::=      Logical Screen Descriptor [Global Color Table]
 * <Data> ::=                <Graphic Block>  |
 *                           <Special-Purpose Block>
 * <Graphic Block> ::=       [Graphic Control Extension] <Graphic-Rendering Block>
 * <Graphic-Rendering Block> ::=  <Table-Based Image>  |
 *                                Plain Text Extension
 * <Table-Based Image> ::=   Image Descriptor [Local Color Table] Image Data
 * <Special-Purpose Block> ::=    Application Extension  |
 *                                Comment Extension
 */
export class GifParser extends EventTarget {
    /** @param {ArrayBuffer} ab */
    constructor(ab: ArrayBuffer);
    /**
     * @type {ByteStream}
     * @private
     */
    private bstream;
    /**
     * @type {string}
     * @private
     */
    private version;
    /**
     * Type-safe way to bind a listener for a GifApplicationExtension.
     * @param {function(CustomEvent<GifApplicationExtension>): void} listener
     * @returns {GifParser} for chaining
     */
    onApplicationExtension(listener: (arg0: CustomEvent<GifApplicationExtension>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for a GifCommentExtension.
     * @param {function(CustomEvent<GifCommentExtension>): void} listener
     * @returns {GifParser} for chaining
     */
    onCommentExtension(listener: (arg0: CustomEvent<GifCommentExtension>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for a GifGraphicControlExtension.
     * @param {function(CustomEvent<GifGraphicControlExtension>): void} listener
     * @returns {GifParser} for chaining
     */
    onGraphicControlExtension(listener: (arg0: CustomEvent<GifGraphicControlExtension>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for a GifHeader.
     * @param {function(CustomEvent<GifHeader>): void} listener
     * @returns {GifParser} for chaining
     */
    onHeader(listener: (arg0: CustomEvent<GifHeader>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for a GifLogicalScreen.
     * @param {function(CustomEvent<GifLogicalScreen>): void} listener
     * @returns {GifParser} for chaining
     */
    onLogicalScreen(listener: (arg0: CustomEvent<GifLogicalScreen>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for a GifPlainTextExtension.
     * @param {function(CustomEvent<GifPlainTextExtension>): void} listener
     * @returns {GifParser} for chaining
     */
    onPlainTextExtension(listener: (arg0: CustomEvent<GifPlainTextExtension>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for a GifTableBasedImage.
     * @param {function(CustomEvent<GifTableBasedImage>): void} listener
     * @returns {GifParser} for chaining
     */
    onTableBasedImage(listener: (arg0: CustomEvent<GifTableBasedImage>) => void): GifParser;
    /**
     * Type-safe way to bind a listener for the GifTrailer.
     * @param {function(CustomEvent): void} listener
     * @returns {GifParser} for chaining
     */
    onTrailer(listener: (arg0: CustomEvent) => void): GifParser;
    /**
     * @returns {Promise<void>} A Promise that resolves when the parsing is complete.
     */
    start(): Promise<void>;
    /**
     * @private
     * @returns {boolean} True if this was not the last block.
     */
    private readGraphicBlock;
    /**
     * @private
     * @returns {Uint8Array} Data from the sub-block, or null if this was the last, zero-length block.
     */
    private readSubBlock;
}
export type GifHeader = {
    version: string;
};
export type GifColor = {
    red: number;
    green: number;
    blue: number;
};
export type GifLogicalScreen = {
    logicalScreenWidth: number;
    logicalScreenHeight: number;
    globalColorTableFlag: boolean;
    colorResolution: number;
    sortFlag: boolean;
    globalColorTableSize: number;
    backgroundColorIndex: number;
    pixelAspectRatio: number;
    /**
     * Only if globalColorTableFlag is true.
     */
    globalColorTable?: GifColor[] | undefined;
};
export type GifTableBasedImage = {
    imageLeftPosition: number;
    imageTopPosition: number;
    imageWidth: number;
    imageHeight: number;
    localColorTableFlag: boolean;
    interlaceFlag: boolean;
    sortFlag: boolean;
    localColorTableSize: number;
    /**
     * Only if localColorTableFlag is true.
     */
    localColorTable?: GifColor[] | undefined;
    lzwMinimumCodeSize: number;
    imageData: Uint8Array;
};
export type GifGraphicControlExtension = {
    disposalMethod: number;
    userInputFlag: boolean;
    transparentColorFlag: boolean;
    delayTime: number;
    transparentColorIndex: number;
};
export type GifCommentExtension = {
    comment: string;
};
export type GifPlainTextExtension = {
    textGridLeftPosition: number;
    textGridTopPosition: number;
    textGridWidth: number;
    textGridHeight: number;
    characterCellWidth: number;
    characterCellHeight: number;
    textForegroundColorIndex: number;
    textBackgroundColorIndex: number;
    plainText: string;
};
export type GifApplicationExtension = {
    applicationIdentifier: string;
    applicationAuthenticationCode: Uint8Array;
    applicationData: Uint8Array;
};
//# sourceMappingURL=gif.d.ts.map
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
export class GifHeaderParseEvent extends Event {
    /** @param {GifHeader} header */
    constructor(header: GifHeader);
    /** @type {GifHeader} */
    header: GifHeader;
}
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
export class GifLogicalScreenParseEvent extends Event {
    /** @param {GifLogicalScreen} */
    constructor(logicalScreen: any);
    /** @type {GifLogicalScreen} */
    logicalScreen: GifLogicalScreen;
}
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
export class GifTableBasedImageEvent extends Event {
    /** @param {GifTableBasedImage} img */
    constructor(img: GifTableBasedImage);
    /** @type {GifTableBasedImage} */
    tableBasedImage: GifTableBasedImage;
}
/**
 * @typedef GifGraphicControlExtension
 * @property {number} disposalMethod
 * @property {boolean} userInputFlag
 * @property {boolean} transparentColorFlag
 * @property {number} delayTime
 * @property {number} transparentColorIndex
 */
export class GifGraphicControlExtensionEvent extends Event {
    /** @param {GifGraphicControlExtension} ext */
    constructor(ext: GifGraphicControlExtension);
    /** @type {GifGraphicControlExtension} */
    graphicControlExtension: GifGraphicControlExtension;
}
/**
 * @typedef GifCommentExtension
 * @property {string} comment
 */
export class GifCommentExtensionEvent extends Event {
    /** @param {string} comment */
    constructor(comment: string);
    /** @type {string} */
    comment: string;
}
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
export class GifPlainTextExtensionEvent extends Event {
    /** @param {GifPlainTextExtension} ext */
    constructor(ext: GifPlainTextExtension);
    /** @type {GifPlainTextExtension} */
    plainTextExtension: GifPlainTextExtension;
}
/**
 * @typedef GifApplicationExtension
 * @property {string} applicationIdentifier
 * @property {Uint8Array} applicationAuthenticationCode
 * @property {Uint8Array} applicationData
 */
export class GifApplicationExtensionEvent extends Event {
    /** @param {GifApplicationExtension} ext */
    constructor(ext: GifApplicationExtension);
    /** @type {GifApplicationExtension} */
    applicationExtension: GifApplicationExtension;
}
export class GifTrailerEvent extends Event {
    constructor();
}
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
    /**
     * @param {ArrayBuffer} ab
     */
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
     * Overridden so that the type hints for eventType are specific.
     * @param {'application_extension'|'comment_extension'|'graphical_control_extension'|'header'|'logical_screen'|'plain_text_extension'|'table_based_image'|'trailer'} eventType
     * @param {EventListenerOrEventListenerObject} listener
     * @override
     */
    override addEventListener(eventType: 'application_extension' | 'comment_extension' | 'graphical_control_extension' | 'header' | 'logical_screen' | 'plain_text_extension' | 'table_based_image' | 'trailer', listener: EventListenerOrEventListenerObject): void;
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
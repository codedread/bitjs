/*
 * gif.js
 *
 * An event-based parser for GIF images.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */

import { BitStream } from '../../io/bitstream.js';
import { ByteStream } from '../../io/bytestream.js';
import { createEvent } from './parsers.js';

// https://www.w3.org/Graphics/GIF/spec-gif89a.txt

export const GifParseEventType = {
  APPLICATION_EXTENSION: 'application_extension',
  COMMENT_EXTENSION: 'comment_extension',
  GRAPHIC_CONTROL_EXTENSION: 'graphic_control_extension',
  HEADER: 'header',
  LOGICAL_SCREEN: 'logical_screen',
  PLAIN_TEXT_EXTENSION: 'plain_text_extension',
  TABLE_BASED_IMAGE: 'table_based_image',
  TRAILER: 'trailer',
};

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
  /**
   * @type {ByteStream}
   * @private
   */
  bstream;

  /**
   * @type {string}
   * @private
   */
  version;

  /** @param {ArrayBuffer} ab */
  constructor(ab) {
    super();
    this.bstream = new ByteStream(ab);
    // The entire GIF structure is Little-Endian (which is actually ByteStream's default).
    this.bstream.setLittleEndian();
  }

  /**
   * Type-safe way to bind a listener for a GifApplicationExtension.
   * @param {function(CustomEvent<GifApplicationExtension>): void} listener
   * @returns {GifParser} for chaining
   */
  onApplicationExtension(listener) {
    super.addEventListener(GifParseEventType.APPLICATION_EXTENSION, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a GifCommentExtension.
   * @param {function(CustomEvent<GifCommentExtension>): void} listener
   * @returns {GifParser} for chaining
   */
  onCommentExtension(listener) {
    super.addEventListener(GifParseEventType.COMMENT_EXTENSION, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a GifGraphicControlExtension.
   * @param {function(CustomEvent<GifGraphicControlExtension>): void} listener
   * @returns {GifParser} for chaining
   */
  onGraphicControlExtension(listener) {
    super.addEventListener(GifParseEventType.GRAPHIC_CONTROL_EXTENSION, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a GifHeader.
   * @param {function(CustomEvent<GifHeader>): void} listener
   * @returns {GifParser} for chaining
   */
  onHeader(listener) {
    super.addEventListener(GifParseEventType.HEADER, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a GifLogicalScreen.
   * @param {function(CustomEvent<GifLogicalScreen>): void} listener
   * @returns {GifParser} for chaining
   */
  onLogicalScreen(listener) {
    super.addEventListener(GifParseEventType.LOGICAL_SCREEN, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a GifPlainTextExtension.
   * @param {function(CustomEvent<GifPlainTextExtension>): void} listener
   * @returns {GifParser} for chaining
   */
  onPlainTextExtension(listener) {
    super.addEventListener(GifParseEventType.PLAIN_TEXT_EXTENSION, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a GifTableBasedImage.
   * @param {function(CustomEvent<GifTableBasedImage>): void} listener
   * @returns {GifParser} for chaining
   */
  onTableBasedImage(listener) {
    super.addEventListener(GifParseEventType.TABLE_BASED_IMAGE, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for the GifTrailer.
   * @param {function(CustomEvent): void} listener
   * @returns {GifParser} for chaining
   */
  onTrailer(listener) {
    super.addEventListener(GifParseEventType.TRAILER, listener);
    return this;
  }

  /**
   * @returns {Promise<void>} A Promise that resolves when the parsing is complete.
   */
  async start() {
    // Header.
    const gif = this.bstream.readString(3); // "GIF"
    if (gif !== "GIF") throw `Not GIF: ${gif}`;

    const version = this.version = this.bstream.readString(3); // "87a" or "89a"
    if (!["87a", "89a"].includes(version)) throw `Bad version: ${version}`;

    this.dispatchEvent(createEvent(GifParseEventType.HEADER, {version}));

    // Logical Screen Descriptor.
    const logicalScreenWidth = this.bstream.readNumber(2);
    const logicalScreenHeight = this.bstream.readNumber(2);

    const bitstream = new BitStream(this.bstream.readBytes(1).buffer, true);
    const globalColorTableFlag = !!bitstream.readBits(1);
    const colorResolution = bitstream.readBits(3) + 1;
    const sortFlag = !!bitstream.readBits(1); // sortFlag
    const globalColorTableSize = 2 ** (bitstream.readBits(3) + 1);
    const backgroundColorIndex = this.bstream.readNumber(1);
    const pixelAspectRatio = this.bstream.readNumber(1);

    // Global Color Table
    let globalColorTable = undefined;
    if (globalColorTableFlag) {
      globalColorTable = [];
      // Series of R,G,B.
      for (let c = 0; c < globalColorTableSize; ++c) {
        globalColorTable.push(/** @type {GifColor} */ ({
          red: this.bstream.readNumber(1),
          green: this.bstream.readNumber(1),
          blue: this.bstream.readNumber(1),
        }));
      }
    }
    this.dispatchEvent(createEvent(GifParseEventType.LOGICAL_SCREEN,
      /** @type {GifLogicalScreen} */ ({
        logicalScreenWidth,
        logicalScreenHeight,
        globalColorTableFlag,
        colorResolution,
        sortFlag,
        globalColorTableSize,
        backgroundColorIndex,
        pixelAspectRatio,
        globalColorTable,
      })
    ));

    while (this.readGraphicBlock()) {
      // Read a graphic block
    }  
  }

  /**
   * @private
   * @returns {boolean} True if this was not the last block.
   */
  readGraphicBlock() {
    let nextByte = this.bstream.readNumber(1);

    // Image Descriptor.
    if (nextByte === 0x2C) {
      const imageLeftPosition = this.bstream.readNumber(2);
      const imageTopPosition = this.bstream.readNumber(2);
      const imageWidth = this.bstream.readNumber(2);
      const imageHeight = this.bstream.readNumber(2);

      const bitstream = new BitStream(this.bstream.readBytes(1).buffer, true);
      const localColorTableFlag = !!bitstream.readBits(1);
      const interlaceFlag = !!bitstream.readBits(1);
      const sortFlag = !!bitstream.readBits(1);
      bitstream.readBits(2); // reserved
      const localColorTableSize = 2 ** (bitstream.readBits(3) + 1);

      let localColorTable = undefined;
      if (localColorTableFlag) {
        // this.bstream.readBytes(3 * localColorTableSize);
        localColorTable = [];
        // Series of R,G,B.
        for (let c = 0; c < localColorTableSize; ++c) {
          localColorTable.push(/** @type {GifColor} */ ({
            red: this.bstream.readNumber(1),
            green: this.bstream.readNumber(1),
            blue: this.bstream.readNumber(1),
          }));
        }
      }

      // Table-Based Image.
      const lzwMinimumCodeSize = this.bstream.readNumber(1);
      const bytesArr = [];
      let bytes;
      let totalNumBytes = 0;
      while ((bytes = this.readSubBlock())) {
        totalNumBytes += bytes.byteLength;
        bytesArr.push(bytes);
      }

      const imageData = new Uint8Array(totalNumBytes);
      let ptr = 0;
      for (const arr of bytesArr) {
        imageData.set(arr, ptr);
        ptr += arr.byteLength;
      }

      this.dispatchEvent(createEvent(GifParseEventType.TABLE_BASED_IMAGE,
        /** @type {GifTableBasedImage} */ ({
          imageLeftPosition,
          imageTopPosition,
          imageWidth,
          imageHeight,
          localColorTableFlag,
          interlaceFlag,
          sortFlag,
          localColorTableSize,
          localColorTable,
          lzwMinimumCodeSize,
          imageData,
        })
      ));

      return true;
    }
    // Extensions.
    else if (nextByte === 0x21) {
      if (this.version !== '89a') {
        throw `Found Extension Introducer (0x21) but was not GIF 89a: ${this.version}`;
      }

      const label = this.bstream.readNumber(1);

      // Graphic Control Extension.
      if (label === 0xF9) {
        const blockSize = this.bstream.readNumber(1);
        if (blockSize !== 4) throw `GCE: Block size of ${blockSize}`;

        // Packed Fields.
        const bitstream = new BitStream(this.bstream.readBytes(1).buffer, true);
        bitstream.readBits(3); // Reserved
        const disposalMethod = bitstream.readBits(3);
        const userInputFlag = !!bitstream.readBits(1);
        const transparentColorFlag = !!bitstream.readBits(1);

        const delayTime = this.bstream.readNumber(2);
        const transparentColorIndex = this.bstream.readNumber(1);
        const blockTerminator = this.bstream.readNumber(1);
        if (blockTerminator !== 0) throw `GCE: Block terminator of ${blockTerminator}`;

        this.dispatchEvent(createEvent(GifParseEventType.GRAPHIC_CONTROL_EXTENSION,
          /** @type {GifGraphicControlExtension} */ ({
            disposalMethod,
            userInputFlag,
            transparentColorFlag,
            delayTime,
            transparentColorIndex,
          })
        ));
        return true;
      }

      // Comment Extension.
      else if (label === 0xFE) {
        let bytes;
        let comment = '';
        while ((bytes = this.readSubBlock())) {
          comment += new TextDecoder().decode(bytes);
        }
        this.dispatchEvent(createEvent(GifParseEventType.COMMENT_EXTENSION, comment));
        return true;
      }

      // Plain Text Extension.
      else if (label === 0x01) {
        const blockSize = this.bstream.readNumber(1);
        if (blockSize !== 12) throw `PTE: Block size of ${blockSize}`;

        const textGridLeftPosition = this.bstream.readNumber(2);
        const textGridTopPosition = this.bstream.readNumber(2);
        const textGridWidth = this.bstream.readNumber(2);
        const textGridHeight = this.bstream.readNumber(2);
        const characterCellWidth = this.bstream.readNumber(1);
        const characterCellHeight = this.bstream.readNumber(1);
        const textForegroundColorIndex = this.bstream.readNumber(1);
        const textBackgroundColorIndex = this.bstream.readNumber(1);
        let bytes;
        let plainText = ''
        while ((bytes = this.readSubBlock())) {
          plainText += new TextDecoder().decode(bytes);
        }

        this.dispatchEvent(createEvent(GifParseEventType.PLAIN_TEXT_EXTENSION,
          /** @type {GifPlainTextExtension} */ ({
            textGridLeftPosition,
            textGridTopPosition,
            textGridWidth,
            textGridHeight,
            characterCellWidth,
            characterCellHeight,
            textForegroundColorIndex,
            textBackgroundColorIndex,
            plainText,
          })
        ));

        return true;
      }

      // Application Extension.
      else if (label === 0xFF) {
        const blockSize = this.bstream.readNumber(1);
        if (blockSize !== 11) throw `AE: Block size of ${blockSize}`;

        const applicationIdentifier = this.bstream.readString(8);
        const applicationAuthenticationCode = this.bstream.readBytes(3);
        const bytesArr = [];
        let bytes;
        let totalNumBytes = 0;
        while ((bytes = this.readSubBlock())) {
          totalNumBytes += bytes.byteLength;
          bytesArr.push(bytes);
        }

        const applicationData = new Uint8Array(totalNumBytes);
        let ptr = 0;
        for (const arr of bytesArr) {
          applicationData.set(arr, ptr);
          ptr += arr.byteLength;
        }

        this.dispatchEvent(createEvent(GifParseEventType.APPLICATION_EXTENSION,
          /** {@type GifApplicationExtension} */ ({
            applicationIdentifier,
            applicationAuthenticationCode,
            applicationData,
          })
        ));

        return true;
      }

      else {
        throw `Unrecognized extension label=0x${label.toString(16)}`;
      }
    }
    else if (nextByte === 0x3B) {
      this.dispatchEvent(createEvent(GifParseEventType.TRAILER));
      // Read the trailer.
      return false;
    }
    else {
      throw `Unknown marker: 0x${nextByte.toString(16)}`;
    }
  }

  /**
   * @private
   * @returns {Uint8Array} Data from the sub-block, or null if this was the last, zero-length block.
   */
  readSubBlock() {
    let subBlockSize = this.bstream.readNumber(1);
    if (subBlockSize === 0) return null;
    return this.bstream.readBytes(subBlockSize);
  }
}

/*
 * jpeg.js
 *
 * An event-based parser for JPEG images.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */

import { ByteStream } from '../../io/bytestream.js';
import { getExifProfile } from './exif.js';
import { createEvent } from './parsers.js';

/** @typedef {import('./exif.js').ExifValue} ExifValue */

// https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format
// https://www.media.mit.edu/pia/Research/deepview/exif.html
// https://mykb.cipindanci.com/archive/SuperKB/1294/JPEG%20File%20Layout%20and%20Format.htm
// https://www.cipa.jp/std/documents/e/DC-008-2012_E.pdf

let DEBUG = false;

/** @enum {string} */
export const JpegParseEventType = {
  APP0_MARKER: 'app0_marker',
  APP0_EXTENSION: 'app0_extension',
  APP1_EXIF: 'app1_exif',
  DEFINE_QUANTIZATION_TABLE: 'define_quantization_table',
  DEFINE_HUFFMAN_TABLE: 'define_huffman_table',
  START_OF_FRAME: 'start_of_frame',
  START_OF_SCAN: 'start_of_scan',
}

/** @enum {number} */
export const JpegSegmentType = {
  SOF0: 0xC0,
  SOF1: 0xC1,
  SOF2: 0xC2,
  DHT: 0xC4,
  SOI: 0xD8,
  EOI: 0xD9,
  SOS: 0xDA,
  DQT: 0xDB,
  APP0: 0xE0,
  APP1: 0xE1,
};

/**
 * @param {Uint8Array} bytes An array of bytes of size 2.
 * @returns {JpegSegmentType} Returns the second byte in bytes.
 */
function getJpegMarker(bytes) {
  if (bytes.byteLength < 2) throw `Bad bytes length: ${bytes.byteLength}`;
  if (bytes[0] !== 0xFF) throw `Bad marker, first byte=0x${bytes[0].toString(16)}`;
  return bytes[1];
}

/** @enum {number} */
export const JpegDensityUnits = {
  NO_UNITS: 0,
  PIXELS_PER_INCH: 1,
  PIXELS_PER_CM: 2,
};

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

/** @enum {number} */
export const JpegExtensionThumbnailFormat = {
  JPEG: 0x10,
  ONE_BYTE_PER_PIXEL_PALETTIZED: 0x11,
  THREE_BYTES_PER_PIXEL_RGB: 0x13,
};

/**
 * @typedef JpegApp0Extension
 * @property {JpegExtensionThumbnailFormat} thumbnailFormat
 * @property {Uint8Array} thumbnailData Raw thumbnail data
 */

/** @typedef {Map<number, ExifValue>} JpegExifProfile */

/**
 * @typedef JpegDefineQuantizationTable
 * @property {number} tableNumber Table/component number.
 * @property {number} precision (0=byte, 1=word).
 * @property {number[]} tableValues 64 numbers representing the quantization table.
 */

/** @enum {number} */
export const JpegHuffmanTableType = {
  DC: 0,
  AC: 1,
};

/**
 * @typedef JpegDefineHuffmanTable
 * @property {number} tableNumber Table/component number (0-3).
 * @property {JpegHuffmanTableType} tableType Either DC or AC.
 * @property {number[]} numberOfSymbols A 16-byte array specifying the # of symbols of each length.
 * @property {number[]} symbols
 */

/** @enum {number} */
export const JpegDctType = {
  BASELINE: 0,
  EXTENDED_SEQUENTIAL: 1,
  PROGRESSIVE: 2,
};

/** @enum {number} */
export const JpegComponentType = {
  Y: 1,
  CB: 2,
  CR: 3,
  I: 4,
  Q: 5,
};

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
  /**
   * @type {ByteStream}
   * @private
   */
  bstream;

  /**
   * @type {boolean}
   * @private
   */
  hasApp0MarkerSegment = false;

  /** @param {ArrayBuffer} ab */
  constructor(ab) {
    super();
    this.bstream = new ByteStream(ab);
  }

  /**
   * Type-safe way to bind a listener for a JpegApp0Marker.
   * @param {function(CustomEvent<JpegApp0Marker>): void} listener
   * @returns {JpegParser} for chaining
   */
  onApp0Marker(listener) {
    super.addEventListener(JpegParseEventType.APP0_MARKER, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a JpegApp0Extension.
   * @param {function(CustomEvent<JpegApp0Extension>): void} listener
   * @returns {JpegParser} for chaining
   */
  onApp0Extension(listener) {
    super.addEventListener(JpegParseEventType.APP0_EXTENSION, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a JpegExifProfile.
   * @param {function(CustomEvent<JpegExifProfile>): void} listener
   * @returns {JpegParser} for chaining
   */
  onApp1Exif(listener) {
    super.addEventListener(JpegParseEventType.APP1_EXIF, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a JpegDefineQuantizationTable.
   * @param {function(CustomEvent<JpegDefineQuantizationTable>): void} listener
   * @returns {JpegParser} for chaining
   */
  onDefineQuantizationTable(listener) {
    super.addEventListener(JpegParseEventType.DEFINE_QUANTIZATION_TABLE, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a JpegDefineHuffmanTable.
   * @param {function(CustomEvent<JpegDefineHuffmanTable>): void} listener
   * @returns {JpegParser} for chaining
   */
  onDefineHuffmanTable(listener) {
    super.addEventListener(JpegParseEventType.DEFINE_HUFFMAN_TABLE, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a JpegStartOfFrame.
   * @param {function(CustomEvent<JpegStartOfFrame>): void} listener
   * @returns {JpegParser} for chaining
   */
  onStartOfFrame(listener) {
    super.addEventListener(JpegParseEventType.START_OF_FRAME, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a JpegStartOfScan.
   * @param {function(CustomEvent<JpegStartOfScan>): void} listener
   * @returns {JpegParser} for chaining
   */
  onStartOfScan(listener) {
    super.addEventListener(JpegParseEventType.START_OF_SCAN, listener);
    return this;
  }

  /** @returns {Promise<void>} A Promise that resolves when the parsing is complete. */
  async start() {
    const segmentType = getJpegMarker(this.bstream.readBytes(2));
    if (segmentType !== JpegSegmentType.SOI) throw `Did not start with a SOI`;

    let jpegMarker;
    do {
      jpegMarker = getJpegMarker(this.bstream.readBytes(2));

      if (jpegMarker === JpegSegmentType.APP0) {
        this.bstream.setBigEndian();
        const length = this.bstream.readNumber(2);
        const skipAheadStream = this.bstream.tee().skip(length - 2);

        const identifier = this.bstream.readString(4);
        if (identifier === 'JFIF') {
          if (this.hasApp0MarkerSegment) throw `JFIF found after JFIF`;
          if (this.bstream.readNumber(1) !== 0) throw 'No null byte terminator for JFIF';

          this.hasApp0MarkerSegment = true;
          const majorVer = `${this.bstream.readNumber(1)}.`;
          const minorVer = `${this.bstream.readNumber(1)}`.padStart(2, '0');
          const densityUnits = this.bstream.readNumber(1);
          const xDensity = this.bstream.readNumber(2);
          const yDensity = this.bstream.readNumber(2);
          const xThumbnail = this.bstream.readNumber(1);
          const yThumbnail = this.bstream.readNumber(1);
  
          /** @type {JpegApp0Marker} */
          let app0MarkerSegment = {
            jfifVersion: `${majorVer}${minorVer}`,
            densityUnits,
            xDensity,
            yDensity,
            xThumbnail,
            yThumbnail,
            thumbnailData: this.bstream.readBytes(3 * xThumbnail * yThumbnail),
          };
          this.dispatchEvent(createEvent(JpegParseEventType.APP0_MARKER, app0MarkerSegment));  
        }
        else if (identifier === 'JFXX') {
          if (!this.hasApp0MarkerSegment) throw `JFXX found without JFIF`;
          if (this.bstream.readNumber(1) !== 0) throw 'No null byte terminator for JFXX';

          const thumbnailFormat = this.bstream.readNumber(1);
          if (!Object.values(JpegExtensionThumbnailFormat).includes(thumbnailFormat)) {
            throw `Bad Extension Thumbnail Format: ${thumbnailFormat}`;
          }

          // The JFXX segment has length (2), 'JFXX' (4), null byte (1), thumbnail format (1)
          const thumbnailData = this.bstream.readBytes(length - 8);

          /** @type {JpegApp0Extension} */
          let app0ExtensionSegment = {
            thumbnailFormat,
            thumbnailData,
          };
          this.dispatchEvent(createEvent(JpegParseEventType.APP0_EXTENSION, app0ExtensionSegment));
        }
        else {
          throw `Bad APP0 identifier: ${identifier}`;
        }

        this.bstream = skipAheadStream;
      } // End of APP0
      else if (jpegMarker === JpegSegmentType.APP1) {
        this.bstream.setBigEndian();
        const length = this.bstream.readNumber(2);
        const skipAheadStream = this.bstream.tee().skip(length - 2);

        const identifier = this.bstream.readString(4);
        if (identifier !== 'Exif') {
          // TODO: Handle XMP.
          // console.log(identifier + this.bstream.readString(length - 2 - 4));
          this.bstream = skipAheadStream;
          continue;
        }
        if (this.bstream.readNumber(2) !== 0) throw `No null byte termination`;

        const exifValueMap = getExifProfile(this.bstream);
        this.dispatchEvent(createEvent(JpegParseEventType.APP1_EXIF, exifValueMap));

        this.bstream = skipAheadStream;
      } // End of APP1
      else if (jpegMarker === JpegSegmentType.DQT) {
        this.bstream.setBigEndian();
        const length = this.bstream.readNumber(2);

        const dqtLength = length - 2;
        let ptr = 0;
        while (ptr < dqtLength) {
          // https://gist.github.com/FranckFreiburger/d8e7445245221c5cf38e69a88f22eeeb#file-getjpegquality-js-L76
          const firstByte = this.bstream.readNumber(1);
          // Lower 4 bits are the component index.
          const tableNumber = (firstByte & 0xF);
          // Upper 4 bits are the precision (0=byte, 1=word).
          const precision = ((firstByte & 0xF0) >> 4);
          if (precision !== 0 && precision !== 1) throw `Weird value for DQT precision: ${precision}`;

          const valSize = precision === 0 ? 1 : 2;
          const tableValues = new Array(64);
          for (let v = 0; v < 64; ++v) {
            tableValues[v] = this.bstream.readNumber(valSize);
          }

          /** @type {JpegDefineQuantizationTable} */
          const table = {
            tableNumber,
            precision,
            tableValues,
          };
          this.dispatchEvent(createEvent(JpegParseEventType.DEFINE_QUANTIZATION_TABLE, table));

          ptr += (1 + valSize * 64);
        }
      } // End of DQT
      else if (jpegMarker === JpegSegmentType.DHT) {
        this.bstream.setBigEndian();
        const length = this.bstream.readNumber(2);
        let ptr = 2;

        while (ptr < length) {
          const firstByte = this.bstream.readNumber(1);
          const tableNumber = (firstByte & 0xF);
          const tableType = ((firstByte & 0xF0) >> 4);
          if (tableNumber > 3) throw `Weird DHT table number = ${tableNumber}`;
          if (tableType !== 0 && tableType !== 1) throw `Weird DHT table type = ${tableType}`;

          const numberOfSymbols = Array.from(this.bstream.readBytes(16));
          let numCodes = 0;
          for (let symbolLength = 1; symbolLength <= 16; ++symbolLength) {
            const numSymbolsAtLength = numberOfSymbols[symbolLength - 1];
            numCodes += numSymbolsAtLength;
          }
          if (numCodes > 256) throw `Bad # of DHT codes: ${numCodes}`;

          const symbols = Array.from(this.bstream.readBytes(numCodes));

          /** @type {JpegDefineHuffmanTable} */
          const table = {
            tableNumber,
            tableType,
            numberOfSymbols,
            symbols,
          };
          this.dispatchEvent(createEvent(JpegParseEventType.DEFINE_HUFFMAN_TABLE, table));

          ptr += (1 + 16 + numCodes);
        }
        if (ptr !== length) throw `Bad DHT ptr: ${ptr}!`;
      } // End of DHT
      else if (jpegMarker === JpegSegmentType.SOF0
            || jpegMarker === JpegSegmentType.SOF1
            || jpegMarker === JpegSegmentType.SOF2) {
        this.bstream.setBigEndian();
        const length = this.bstream.readNumber(2);

        const dctType = (jpegMarker - JpegSegmentType.SOF0);
        if (![0, 1, 2].includes(dctType)) throw `Weird DCT type: ${dctType}`;

        const dataPrecision = this.bstream.readNumber(1);
        const imageHeight = this.bstream.readNumber(2);
        const imageWidth = this.bstream.readNumber(2);
        const numberOfComponents = this.bstream.readNumber(1);
        const componentDetails = [];
        for (let c = 0; c < numberOfComponents; ++c) {
          const componentId = this.bstream.readNumber(1);
          const nextByte = this.bstream.readNumber(1);
          const verticalSamplingFactor = (nextByte & 0xF);
          const horizontalSamplingFactor = ((nextByte & 0xF0) >> 4);
          const quantizationTableNumber = this.bstream.readNumber(1);

          componentDetails.push({
            componentId,
            verticalSamplingFactor,
            horizontalSamplingFactor,
            quantizationTableNumber,
          });
        }

        /** @type {JpegStartOfFrame} */
        const sof = {
          dctType,
          dataPrecision,
          imageHeight,
          imageWidth,
          numberOfComponents,
          componentDetails,
        };

        this.dispatchEvent(createEvent(JpegParseEventType.START_OF_FRAME, sof));
      } // End of SOF0, SOF1, SOF2
      else if (jpegMarker === JpegSegmentType.SOS) {
        this.bstream.setBigEndian();
        const length = this.bstream.readNumber(2);
        // console.log(`Inside SOS with length = ${length}`);
        if (length !== 12) throw `Bad length in SOS header: ${length}`;

        /** @type {JpegStartOfScan} */
        const sos = {
          componentsInScan: this.bstream.readNumber(1),
          componentSelectorY: this.bstream.readNumber(1),
          huffmanTableSelectorY: this.bstream.readNumber(1),
          componentSelectorCb: this.bstream.readNumber(1),
          huffmanTableSelectorCb: this.bstream.readNumber(1),
          componentSelectorCr: this.bstream.readNumber(1),
          huffmanTableSelectorCr: this.bstream.readNumber(1),
          scanStartPositionInBlock: this.bstream.readNumber(1),
          scanEndPositionInBlock: this.bstream.readNumber(1),
          successiveApproximationBitPosition: this.bstream.readNumber(1),
        };

        const rawImageDataStream = this.bstream.tee();
        let numBytes = 0;
        // Immediately after SOS header is the compressed image data until the EOI marker is seen.
        // Seek until we find the EOI marker.
        while (true) {
          if (this.bstream.readNumber(1) === 0xFF &&
              this.bstream.peekNumber(1) === JpegSegmentType.EOI) {
            jpegMarker = this.bstream.readNumber(1);
            break;
          } else {
            numBytes++;
          }
        }

        // NOTE: The below will have the null bytes after every 0xFF value.
        sos.rawImageData = rawImageDataStream.readBytes(numBytes);

        this.dispatchEvent(createEvent(JpegParseEventType.START_OF_SCAN, sos));
      } // End of SOS
      else {
        this.bstream.setBigEndian();
        const length = this.bstream.peekNumber(2);
        if (DEBUG) console.log(`Unsupported JPEG marker 0xff${jpegMarker.toString(16)} with length ${length}`);
        this.bstream.skip(length);
      }
    } while (jpegMarker !== JpegSegmentType.EOI);
  }
}

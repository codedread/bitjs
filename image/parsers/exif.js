/*
 * exif.js
 *
 * Parse EXIF.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */

import { ByteStream } from '../../io/bytestream.js';

/** @enum {number} */
export const ExifTagNumber = {
  // Tags used by IFD0.
  IMAGE_DESCRIPTION: 0x010e,
  MAKE: 0x010f,
  MODEL: 0x0110,
  ORIENTATION: 0x0112,
  X_RESOLUTION: 0x011a,
  Y_RESOLUTION: 0x011b,
  RESOLUTION_UNIT: 0x0128,
  SOFTWARE: 0x0131,
  DATE_TIME: 0x0132,
  WHITE_POINT: 0x013e,
  PRIMARY_CHROMATICITIES: 0x013f,
  Y_CB_CR_COEFFICIENTS: 0x0211,
  Y_CB_CR_POSITIONING: 0x0213,
  REFERENCE_BLACK_WHITE: 0x0214,
  COPYRIGHT: 0x8298,
  EXIF_OFFSET: 0x8769,

  // Tags used by Exif SubIFD.
  EXPOSURE_TIME: 0x829a,
  F_NUMBER: 0x829d,
  EXPOSURE_PROGRAM: 0x8822,
  ISO_SPEED_RATINGS: 0x8827,
  EXIF_VERSION: 0x9000,
  DATE_TIME_ORIGINAL: 0x9003,
  DATE_TIME_DIGITIZED: 0x9004,
  COMPONENT_CONFIGURATION: 0x9101,
  COMPRESSED_BITS_PER_PIXEL: 0x9102,
  SHUTTER_SPEED_VALUE: 0x9201,
  APERTURE_VALUE: 0x9202,
  BRIGHTNESS_VALUE: 0x9203,
  EXPOSURE_BIAS_VALUE: 0x9204,
  MAX_APERTURE_VALUE: 0x9205,
  SUBJECT_DISTANCE: 0x9206,
  METERING_MODE: 0x9207,
  LIGHT_SOURCE: 0x9208,
  FLASH: 0x9209,
  FOCAL_LENGTH: 0x920a,
  MAKER_NOTE: 0x927c,
  USER_COMMENT: 0x9286,
  FLASH_PIX_VERSION: 0xa000,
  COLOR_SPACE: 0xa001,
  EXIF_IMAGE_WIDTH: 0xa002,
  EXIF_IMAGE_HEIGHT: 0xa003,
  RELATED_SOUND_FILE: 0xa004,
  EXIF_INTEROPERABILITY_OFFSET: 0xa005,
  FOCAL_PLANE_X_RESOLUTION: 0xa20e,
  FOCAL_PLANE_Y_RESOLUTION: 0x20f,
  FOCAL_PLANE_RESOLUTION_UNIT: 0xa210,
  SENSING_METHOD: 0xa217,
  FILE_SOURCE: 0xa300,
  SCENE_TYPE: 0xa301,

  // Tags used by IFD1.
  IMAGE_WIDTH: 0x0100,
  IMAGE_LENGTH: 0x0101,
  BITS_PER_SAMPLE: 0x0102,
  COMPRESSION: 0x0103,
  PHOTOMETRIC_INTERPRETATION: 0x0106,
  STRIP_OFFSETS: 0x0111,
  SAMPLES_PER_PIXEL: 0x0115,
  ROWS_PER_STRIP: 0x0116,
  STRIP_BYTE_COUNTS: 0x0117,
  // X_RESOLUTION, Y_RESOLUTION
  PLANAR_CONFIGURATION: 0x011c,
  // RESOLUTION_UNIT
  JPEG_IF_OFFSET: 0x0201,
  JPEG_IF_BYTE_COUNT: 0x0202,
  // Y_CB_CR_COEFFICIENTS
  Y_CB_CR_SUB_SAMPLING: 0x0212,
  // Y_CB_CR_POSITIONING, REFERENCE_BLACK_WHITE
};

/** @enum {number} */
export const ExifDataFormat = {
  UNSIGNED_BYTE: 1,
  ASCII_STRING: 2,
  UNSIGNED_SHORT: 3,
  UNSIGNED_LONG: 4,
  UNSIGNED_RATIONAL: 5,
  SIGNED_BYTE: 6,
  UNDEFINED: 7,
  SIGNED_SHORT: 8,
  SIGNED_LONG: 9,
  SIGNED_RATIONAL: 10,
  SINGLE_FLOAT: 11,
  DOUBLE_FLOAT: 12,
};

/**
 * @typedef ExifValue
 * @property {ExifTagNumber} tagNumber The numerical value of the tag.
 * @property {string=} tagName A string representing the tag number.
 * @property {ExifDataFormat} dataFormat The data format.
 * @property {number=} numericalValue Populated for SIGNED/UNSIGNED BYTE/SHORT/LONG/FLOAT.
 * @property {string=} stringValue Populated only for ASCII_STRING.
 * @property {number=} numeratorValue Populated only for SIGNED/UNSIGNED RATIONAL.
 * @property {number=} denominatorValue Populated only for SIGNED/UNSIGNED RATIONAL.
 * @property {number=} numComponents Populated only for UNDEFINED data format.
 * @property {number=} offsetValue Populated only for UNDEFINED data format.
 */

/**
 * @param {number} tagNumber 
 * @param {string} type 
 * @param {number} len 
 * @param {number} dataVal 
 */
function warnBadLength(tagNumber, type, len, dataVal) {
  const hexTag = tagNumber.toString(16);
  console.warn(`Tag 0x${hexTag} is ${type} with len=${len} and data=${dataVal}`);
}

/**
 * @param {ByteStream} stream
 * @param {ByteStream} lookAheadStream
 * @param {boolean} debug
 * @returns {ExifValue}
 */
export function getExifValue(stream, lookAheadStream, DEBUG = false) {
  const tagNumber = stream.readNumber(2);
  let tagName = findNameWithValue(ExifTagNumber, tagNumber);
  if (!tagName) {
    tagName = `UNKNOWN (0x${tagNumber.toString(16)})`;
  }

  let dataFormat = stream.readNumber(2);

  // Handle bad types for special tags.
  if (tagNumber === ExifTagNumber.EXIF_OFFSET) {
    dataFormat = ExifDataFormat.UNSIGNED_LONG;
  }
  
  const dataFormatName = findNameWithValue(ExifDataFormat, dataFormat);
  if (!dataFormatName) throw `Invalid data format: ${dataFormat}`;

  /** @type {ExifValue} */
  const exifValue = {
    tagNumber,
    tagName,
    dataFormat,
  };

  let len = stream.readNumber(4);
  switch (dataFormat) {
    case ExifDataFormat.UNSIGNED_BYTE:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekNumber(4));
      }
      exifValue.numericalValue = stream.readNumber(1);
      stream.skip(3);
      break;
    case ExifDataFormat.ASCII_STRING:
      if (len <= 4) {
        exifValue.stringValue = stream.readString(4);
      } else {
        const strOffset = stream.readNumber(4);
        exifValue.stringValue = lookAheadStream.tee().skip(strOffset).readString(len - 1);
      }
      break;
    case ExifDataFormat.UNSIGNED_SHORT:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekNumber(4));
      }
      exifValue.numericalValue = stream.readNumber(2);
      stream.skip(2);
      break;
    case ExifDataFormat.UNSIGNED_LONG:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekNumber(4));
      }
      exifValue.numericalValue = stream.readNumber(4);
      break;
    case ExifDataFormat.UNSIGNED_RATIONAL:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekNumber(4));
      }

      const uratStream = lookAheadStream.tee().skip(stream.readNumber(4));
      exifValue.numeratorValue = uratStream.readNumber(4);
      exifValue.denominatorValue = uratStream.readNumber(4);
      break;
    case ExifDataFormat.SIGNED_BYTE:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekSignedNumber(4));
      }
      exifValue.numericalValue = stream.readSignedNumber(1);
      stream.skip(3);
      break;
    case ExifDataFormat.UNDEFINED:
      exifValue.numComponents = len;
      exifValue.offsetValue = stream.readNumber(4);    
      break;
    case ExifDataFormat.SIGNED_SHORT:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekSignedNumber(4));
      }
      exifValue.numericalValue = stream.readSignedNumber(2);
      stream.skip(2);
      break;
    case ExifDataFormat.SIGNED_LONG:
      if (len !== 1) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekSignedNumber(4));
      }
      exifValue.numericalValue = stream.readSignedNumber(4);
      break;
    case ExifDataFormat.SIGNED_RATIONAL:
      if (len !== 1 && DEBUG) {
        warnBadLength(tagNumber, dataFormatName, len, stream.peekNumber(4));
      }

      const ratStream = lookAheadStream.tee().skip(stream.readNumber(4));
      exifValue.numeratorValue = ratStream.readSignedNumber(4);
      exifValue.denominatorValue = ratStream.readSignedNumber(4);
      break;
    default:
      throw `Bad data format: ${dataFormat}`;
  }
  return exifValue;
}

/**
 * Reads an Image File Directory from stream, populating the map.
 * @param {ByteStream} stream The stream to extract the Exif value descriptors.
 * @param {ByteStream} lookAheadStream The lookahead stream if the offset is used.
 * @param {Map<number, ExifValue} exifValueMap This map to add the Exif values.
 * @returns {number} The next IFD offset.
 */
function getExifIfd(stream, lookAheadStream, exifValueMap) {
  let exifOffsetStream;
  const numDirectoryEntries = stream.readNumber(2);
  for (let entry = 0; entry < numDirectoryEntries; ++entry) {
    const exifValue = getExifValue(stream, lookAheadStream);
    const exifTagNumber = exifValue.tagNumber;
    exifValueMap.set(exifTagNumber, exifValue);
    if (exifValue.tagNumber === ExifTagNumber.EXIF_OFFSET) {
      exifOffsetStream = lookAheadStream.tee().skip(exifValue.numericalValue);
    }
  } // Loop over Directory Entries.

  if (exifOffsetStream) {
    getExifIfd(exifOffsetStream, lookAheadStream, exifValueMap);
  }

  const nextIfdOffset = stream.readNumber(4);
  return nextIfdOffset;
}

/**
 * Reads the entire EXIF profile. The first 2 bytes in the stream must be the TIFF marker (II/MM).
 * @param {ByteStream} stream
 * @returns {Map<number, ExifValue} A map of all EXIF values found. The key is the EXIF tag number.
 */
export function getExifProfile(stream) {
  const lookAheadStream = stream.tee();
  const tiffByteAlign = stream.readString(2);
  if (tiffByteAlign === 'II') {
    stream.setLittleEndian();
    lookAheadStream.setLittleEndian();
  } else if (tiffByteAlign === 'MM') {
    stream.setBigEndian();
    lookAheadStream.setBigEndian();
  } else {
    throw `Invalid TIFF byte align symbol: ${tiffByteAlign}`;
  }

  const tiffMarker = stream.readNumber(2);
  if (tiffMarker !== 0x002A) {
    throw `Invalid marker, not 0x002a: 0x${tiffMarker.toString(16)}`;
  }

  /** @type {Map<number, ExifValue} */
  const exifValueMap = new Map();

  // The offset includes the tiffByteAlign (2), marker (2), and the offset field itself (4).
  // It is usually 0x00000008, which means ifdOffsetSkip will almost always be zero.
  const ifdOffsetSkip = stream.readNumber(4) - 8;

  let ifdStream = stream.skip(ifdOffsetSkip).tee();
  let nextIfdOffset;
  while (true) {
    nextIfdOffset = getExifIfd(ifdStream, lookAheadStream, exifValueMap);

    // No more IFDs, so stop the loop.
    if (nextIfdOffset === 0) break;

    // Else, we have another IFD to read, point the stream at it.
    ifdStream = lookAheadStream.tee().skip(nextIfdOffset);
  }

  return exifValueMap;
}

/**
 * @param {Object} obj A numeric enum.
 * @param {number} valToFind The value to find.
 * @returns {string|null}
 */
function findNameWithValue(obj, valToFind) {
  const entry = Object.entries(obj).find(([k,v]) => v === valToFind);
  return entry ? entry[0] : null;
}

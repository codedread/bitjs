/**
 * index.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2020 Google Inc.
 */

/** @typedef {import('./codecs/codecs.js').ProbeStream} ProbeStream */
/** @typedef {import('./codecs/codecs.js').ProbeFormat} ProbeFormat */
/** @typedef {import('./codecs/codecs.js').ProbeInfo} ProbeInfo */

/** @typedef {import('./image/parsers/gif.js').GifApplicationExtension} GifApplicationExtension */
/** @typedef {import('./image/parsers/gif.js').GifColor} GifColor */
/** @typedef {import('./image/parsers/gif.js').GifCommentExtension} GifCommentExtension */
/** @typedef {import('./image/parsers/gif.js').GifGraphicControlExtension} GifGraphicControlExtension */
/** @typedef {import('./image/parsers/gif.js').GifHeader} GifHeader */
/** @typedef {import('./image/parsers/gif.js').GifLogicalScreen} GifLogicalScreen */
/** @typedef {import('./image/parsers/gif.js').GifPlainTextExtension} GifPlainTextExtension */
/** @typedef {import('./image/parsers/gif.js').GifTableBasedImage} GifTableBasedImage */

/** @typedef {import('./image/parsers/jpeg.js').JpegApp0Extension} JpegApp0Extension */
/** @typedef {import('./image/parsers/jpeg.js').JpegApp0Marker} JpegApp0Marker */
/** @typedef {import('./image/parsers/jpeg.js').JpegComponentDetail} JpegComponentDetail */
/** @typedef {import('./image/parsers/jpeg.js').JpegDefineHuffmanTable} JpegDefineHuffmanTable */
/** @typedef {import('./image/parsers/jpeg.js').JpegDefineQuantizationTable} JpegDefineQuantizationTable */
/** @typedef {import('./image/parsers/jpeg.js').JpegStartOfFrame} JpegStartOfFrame */
/** @typedef {import('./image/parsers/jpeg.js').JpegStartOfScan} JpegStartOfScan */

export {
  UnarchiveEvent, UnarchiveEventType, UnarchiveInfoEvent, UnarchiveErrorEvent,
  UnarchiveStartEvent, UnarchiveFinishEvent, UnarchiveProgressEvent, UnarchiveExtractEvent,
  Unarchiver, Unzipper, Unrarrer, Untarrer, getUnarchiver
} from './archive/decompress.js';
export { getFullMIMEString, getShortMIMEString } from './codecs/codecs.js';
export { findMimeType } from './file/sniffer.js';
export { GifParseEventType, GifParser } from './image/parsers/gif.js';
export { JpegApp0ExtensionEvent, JpegApp0MarkerEvent, JpegApp1ExifEvent, JpegComponentType,
         JpegDctType, JpegDefineHuffmanTableEvent, JpegDefineQuantizationTableEvent,
         JpegDensityUnits, JpegExtensionThumbnailFormat, JpegHuffmanTableType, JpegParseEventType,
         JpegParser, JpegSegmentType, JpegStartOfFrameEvent,
         JpegStartOfScanEvent } from './image/parsers/jpeg.js';
export { convertWebPtoPNG, convertWebPtoJPG } from './image/webp-shim/webp-shim.js';
export { BitBuffer } from './io/bitbuffer.js';
export { BitStream } from './io/bitstream.js';
export { ByteBuffer } from './io/bytebuffer.js';
export { ByteStream } from './io/bytestream.js';

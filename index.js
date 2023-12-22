/**
 * index.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2020 Google Inc.
 */

/**
 * @typedef {import('./codecs/codecs.js').ProbeStream} ProbeStream
 */
/**
 * @typedef {import('./codecs/codecs.js').ProbeFormat} ProbeFormat
 */
/**
 * @typedef {import('./codecs/codecs.js').ProbeInfo} ProbeInfo
 */

export {
  UnarchiveEvent, UnarchiveEventType, UnarchiveInfoEvent, UnarchiveErrorEvent,
  UnarchiveStartEvent, UnarchiveFinishEvent, UnarchiveProgressEvent, UnarchiveExtractEvent,
  Unarchiver, Unzipper, Unrarrer, Untarrer, getUnarchiver
} from './archive/decompress.js';
export { getFullMIMEString, getShortMIMEString } from './codecs/codecs.js';
export { findMimeType } from './file/sniffer.js';
export { GifApplicationExtensionEvent, GifCommentExtensionEvent, GifGraphicControlExtensionEvent,
         GifHeaderParseEvent, GifLogicalScreenParseEvent, GifParseEventType, GifParser,
         GifPlainTextExtensionEvent, GifTableBasedImageEvent } from './image/parsers/gif.js';
export { convertWebPtoPNG, convertWebPtoJPG } from './image/webp-shim/webp-shim.js';
export { BitBuffer } from './io/bitbuffer.js';
export { BitStream } from './io/bitstream.js';
export { ByteBuffer } from './io/bytebuffer.js';
export { ByteStream } from './io/bytestream.js';

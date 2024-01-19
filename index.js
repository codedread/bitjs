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

/** @typedef {import('./image/parsers/png.js').PngBackgroundColor} PngBackgroundColor */
/** @typedef {import('./image/parsers/png.js').PngChromaticities} PngChromaticies */
/** @typedef {import('./image/parsers/png.js').PngColor} PngColor */
/** @typedef {import('./image/parsers/png.js').PngCompressedTextualData} PngCompressedTextualData */
/** @typedef {import('./image/parsers/png.js').PngHistogram} PngHistogram */
/** @typedef {import('./image/parsers/png.js').PngImageData} PngImageData */
/** @typedef {import('./image/parsers/png.js').PngImageGamma} PngImageGamma */
/** @typedef {import('./image/parsers/png.js').PngImageHeader} PngImageHeader */
/** @typedef {import('./image/parsers/png.js').PngIntlTextualData} PngIntlTextualData */
/** @typedef {import('./image/parsers/png.js').PngLastModTime} PngLastModTime */
/** @typedef {import('./image/parsers/png.js').PngPalette} PngPalette */
/** @typedef {import('./image/parsers/png.js').PngPhysicalPixelDimensions} PngPhysicalPixelDimensions */
/** @typedef {import('./image/parsers/png.js').PngSignificantBits} PngSignificantBits */
/** @typedef {import('./image/parsers/png.js').PngSuggestedPalette} PngSuggestedPalette */
/** @typedef {import('./image/parsers/png.js').PngSuggestedPaletteEntry} PngSuggestedPaletteEntry */
/** @typedef {import('./image/parsers/png.js').PngTextualData} PngTextualData */
/** @typedef {import('./image/parsers/png.js').PngTransparency} PngTransparency */

export {
  UnarchiveEvent, UnarchiveEventType, UnarchiveInfoEvent, UnarchiveErrorEvent,
  UnarchiveStartEvent, UnarchiveFinishEvent, UnarchiveProgressEvent, UnarchiveExtractEvent,
  Unarchiver, Unzipper, Unrarrer, Untarrer, getUnarchiver
} from './archive/decompress.js';
export { getFullMIMEString, getShortMIMEString } from './codecs/codecs.js';
export { findMimeType } from './file/sniffer.js';
export { GifParseEventType, GifParser } from './image/parsers/gif.js';
export { JpegComponentType, JpegDctType, JpegDensityUnits, JpegExtensionThumbnailFormat,
         JpegHuffmanTableType, JpegParseEventType, JpegParser,
         JpegSegmentType } from './image/parsers/jpeg.js';
export { PngColorType, PngInterlaceMethod, PngParseEventType, PngParser,
  PngUnitSpecifier } from './image/parsers/png.js';
export { convertWebPtoPNG, convertWebPtoJPG } from './image/webp-shim/webp-shim.js';
export { BitBuffer } from './io/bitbuffer.js';
export { BitStream } from './io/bitstream.js';
export { ByteBuffer } from './io/bytebuffer.js';
export { ByteStream } from './io/bytestream.js';

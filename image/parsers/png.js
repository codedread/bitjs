/*
 * png.js
 *
 * An event-based parser for PNG images.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */

import { ByteStream } from '../../io/bytestream.js';
import { getExifProfile } from './exif.js';

/** @typedef {import('./exif.js').ExifValue} ExifValue */

// https://www.w3.org/TR/png-3/
// https://en.wikipedia.org/wiki/PNG#File_format

let DEBUG = false;

const SIG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

/** @enum {string} */
export const PngParseEventType = {
  // Critical chunks.
  IDAT: 'image_data',
  IHDR: 'image_header',
  PLTE: 'palette',

  // Ancillary chunks.
  bKGD: 'background_color',
  cHRM: 'chromaticities_white_point',
  eXIf: 'exif_profile',
  gAMA: 'image_gamma',
  hIST: 'histogram',
  iTXt: 'intl_text_data',
  pHYs: 'physical_pixel_dims',
  sBIT: 'significant_bits',
  sPLT: 'suggested_palette',
  tEXt: 'textual_data',
  tIME: 'last_mod_time',
  tRNS: 'transparency',
  zTXt: 'compressed_textual_data',
};

/** @enum {number} */
export const PngColorType = {
  GREYSCALE: 0,
  TRUE_COLOR: 2,
  INDEXED_COLOR: 3,
  GREYSCALE_WITH_ALPHA: 4,
  TRUE_COLOR_WITH_ALPHA: 6,
};

/** @enum {number} */
export const PngInterlaceMethod = {
  NO_INTERLACE: 0,
  ADAM7_INTERLACE: 1,
}

/**
 * @typedef PngImageHeader
 * @property {number} width
 * @property {number} height
 * @property {number} bitDepth
 * @property {PngColorType} colorType
 * @property {number} compressionMethod
 * @property {number} filterMethod
 * @property {number} interlaceMethod
 */

export class PngImageHeaderEvent extends Event {
  /** @param {PngImageHeader} */
  constructor(header) {
    super(PngParseEventType.IHDR);
    /** @type {PngImageHeader} */
    this.imageHeader = header;
  }
}

export class PngImageGammaEvent extends Event {
  /** @param {number} */
  constructor(gamma) {
    super(PngParseEventType.gAMA);
    /** @type {number} */
    this.gamma = gamma;
  }
}

/**
 * @typedef PngSignificantBits
 * @property {number=} significant_greyscale Populated for color types 0, 4.
 * @property {number=} significant_red Populated for color types 2, 3, 6.
 * @property {number=} significant_green Populated for color types 2, 3, 6.
 * @property {number=} significant_blue Populated for color types 2, 3, 6.
 * @property {number=} significant_alpha Populated for color types 4, 6.
 */

export class PngSignificantBitsEvent extends Event {
  /** @param {PngSignificantBits} */
  constructor(sigBits) {
    super(PngParseEventType.sBIT);
    /** @type {PngSignificantBits} */
    this.sigBits = sigBits;
  }
}

/**
 * @typedef PngChromaticies
 * @property {number} whitePointX
 * @property {number} whitePointY
 * @property {number} redX
 * @property {number} redY
 * @property {number} greenX
 * @property {number} greenY
 * @property {number} blueX
 * @property {number} blueY
 */

export class PngChromaticitiesEvent extends Event {
  /** @param {PngChromaticies} chromaticities */
  constructor(chromaticities) {
    super(PngParseEventType.cHRM);
    /** @type {PngChromaticies} */
    this.chromaticities = chromaticities;
  }
}

/**
 * @typedef PngColor
 * @property {number} red
 * @property {number} green
 * @property {number} blue
 */

/**
 * @typedef PngPalette
 * @property {PngColor[]} entries
 */

export class PngPaletteEvent extends Event {
  /** @param {PngPalette} palette */
  constructor(palette) {
    super(PngParseEventType.PLTE);
    /** @type {PngPalette} */
    this.palette = palette;
  }
}

/**
 * @typedef PngTransparency
 * @property {number=} greySampleValue Populated for color type 0.
 * @property {number=} redSampleValue Populated for color type 2.
 * @property {number=} blueSampleValue Populated for color type 2.
 * @property {number=} greenSampleValue Populated for color type 2.
 * @property {number[]=} alphaPalette Populated for color type 3.
 */

export class PngTransparencyEvent extends Event {
  /** @param {PngTransparency} transparency */
  constructor(transparency) {
    super(PngParseEventType.tRNS);
    /** @type {PngTransparency} */
    this.transparency = transparency;
  }
}

/**
 * @typedef PngImageData
 * @property {Uint8Array} rawImageData
 */

export class PngImageDataEvent extends Event {
  /** @param {PngImageData} data */
  constructor(data) {
    super(PngParseEventType.IDAT);
    /** @type {PngImageData} */
    this.data = data;
  }
}

/**
 * @typedef PngTextualData
 * @property {string} keyword
 * @property {string=} textString
 */

export class PngTextualDataEvent extends Event {
  /** @param {PngTextualData} textualData */
  constructor(textualData) {
    super(PngParseEventType.tEXt);
    /** @type {PngTextualData} */
    this.textualData = textualData;
  }
}

/**
 * @typedef PngCompressedTextualData
 * @property {string} keyword
 * @property {number} compressionMethod Only value supported is 0 for deflate compression.
 * @property {Uint8Array=} compressedText
 */

export class PngCompressedTextualDataEvent extends Event {
  /** @param {PngCompressedTextualData} compressedTextualData */
  constructor(compressedTextualData) {
    super(PngParseEventType.zTXt);
    /** @type {PngCompressedTextualData} */
    this.compressedTextualData = compressedTextualData;
  }
}

/**
 * @typedef PngIntlTextualData
 * @property {string} keyword
 * @property {number} compressionFlag 0 for uncompressed, 1 for compressed.
 * @property {number} compressionMethod 0 means zlib defalt when compressionFlag is 1.
 * @property {string=} languageTag
 * @property {string=} translatedKeyword
 * @property {Uint8Array} text The raw UTF-8 text (may be compressed).
 */

export class PngIntlTextualDataEvent extends Event {
  /** @param {PngIntlTextualData} intlTextualdata */
  constructor(intlTextualdata) {
    super(PngParseEventType.iTXt);
    /** @type {PngIntlTextualData} */
    this.intlTextualdata = intlTextualdata;
  }
}

/**
 * @typedef PngBackgroundColor
 * @property {number=} greyscale Only for color types 0 and 4.
 * @property {number=} red Only for color types 2 and 6.
 * @property {number=} green Only for color types 2 and 6.
 * @property {number=} blue Only for color types 2 and 6.
 * @property {number=} paletteIndex Only for color type 3.
 */

export class PngBackgroundColorEvent extends Event {
  /** @param {PngBackgroundColor} backgroundColor */
  constructor(backgroundColor) {
    super(PngParseEventType.bKGD);
    /** @type {PngBackgroundColor} */
    this.backgroundColor = backgroundColor;
  }
}

/**
 * @typedef PngLastModTime
 * @property {number} year Four-digit year.
 * @property {number} month One-based. Value from 1-12.
 * @property {number} day One-based. Value from 1-31.
 * @property {number} hour Zero-based. Value from 0-23.
 * @property {number} minute Zero-based. Value from 0-59.
 * @property {number} second Zero-based. Value from 0-60 to allow for leap-seconds.
 */

export class PngLastModTimeEvent extends Event {
  /** @param {PngLastModTime} lastModTime */
  constructor(lastModTime) {
    super(PngParseEventType.tIME);
    /** @type {PngLastModTime} */
    this.lastModTime = lastModTime;
  }
}

export const PngUnitSpecifier = {
  UNKNOWN: 0,
  METRE: 1,
};

/**
 * @typedef PngPhysicalPixelDimensions
 * @property {number} pixelPerUnitX
 * @property {number} pixelPerUnitY
 * @property {PngUnitSpecifier} unitSpecifier
 */

export class PngPhysicalPixelDimensionsEvent extends Event {
  /** @param {PngPhysicalPixelDimensions} physicalPixelDimensions */
  constructor(physicalPixelDimensions) {
    super(PngParseEventType.pHYs);
    /** @type {PngPhysicalPixelDimensions} */
    this.physicalPixelDimensions = physicalPixelDimensions;
  }
}

/** @typedef {Map<number, ExifValue>} PngExifProfile */

export class PngExifProfileEvent extends Event {
  /** @param {PngExifProfile} exifProfile */
  constructor(exifProfile) {
    super(PngParseEventType.eXIf);
    /** @type {PngExifProfile} */
    this.exifProfile = exifProfile;
  }
}

/**
 * @typedef PngHistogram
 * @property {number[]} frequencies The # of frequencies matches the # of palette entries.
 */

export class PngHistogramEvent extends Event {
  /** @param {PngHistogram} histogram */
  constructor(histogram) {
    super(PngParseEventType.hIST);
    /** @type {PngHistogram} */
    this.histogram = histogram;
  }
}

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

export class PngSuggestedPaletteEvent extends Event {
  /** @param {PngSuggestedPalette} suggestedPalette */
  constructor(suggestedPalette) {
    super(PngParseEventType.sPLT);
    /** @type {PngSuggestedPalette} */
    this.suggestedPalette = suggestedPalette;
  }
}

/**
 * @typedef PngChunk Internal use only.
 * @property {number} length
 * @property {string} chunkType
 * @property {ByteStream} chunkStream Do not read more than length!
 * @property {number} crc
 */

export class PngParser extends EventTarget {
  /**
   * @type {ByteStream}
   * @private
   */
  bstream;

  /**
   * @type {PngColorType}
   * @private
   */
  colorType;

  /**
   * @type {PngPalette}
   * @private
   */
  palette;

  /** @param {ArrayBuffer} ab */
  constructor(ab) {
    super();
    this.bstream = new ByteStream(ab);
    this.bstream.setBigEndian();
  }

  /**
   * Type-safe way to bind a listener for a PngBackgroundColorEvent.
   * @param {function(PngBackgroundColorEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onBackgroundColor(listener) {
    super.addEventListener(PngParseEventType.bKGD, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngChromaticiesEvent.
   * @param {function(PngChromaticiesEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onChromaticities(listener) {
    super.addEventListener(PngParseEventType.cHRM, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngCompressedTextualDataEvent.
   * @param {function(PngCompressedTextualDataEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onCompressedTextualData(listener) {
    super.addEventListener(PngParseEventType.zTXt, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngExifProfileEvent.
   * @param {function(PngExifProfileEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onExifProfile(listener) {
    super.addEventListener(PngParseEventType.eXIf, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngImageGammaEvent.
   * @param {function(PngImageGammaEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onGamma(listener) {
    super.addEventListener(PngParseEventType.gAMA, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngHistogramEvent.
   * @param {function(PngHistogramEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onHistogram(listener) {
    super.addEventListener(PngParseEventType.hIST, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngImageDataEvent.
   * @param {function(PngImageDataEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onImageData(listener) {
    super.addEventListener(PngParseEventType.IDAT, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngImageHeaderEvent.
   * @param {function(PngImageHeaderEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onImageHeader(listener) {
    super.addEventListener(PngParseEventType.IHDR, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngIntlTextualDataEvent.
   * @param {function(PngIntlTextualDataEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onIntlTextualData(listener) {
    super.addEventListener(PngParseEventType.iTXt, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngLastModTimeEvent.
   * @param {function(PngLastModTimeEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onLastModTime(listener) {
    super.addEventListener(PngParseEventType.tIME, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngPaletteEvent.
   * @param {function(PngPaletteEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onPalette(listener) {
    super.addEventListener(PngParseEventType.PLTE, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngPhysicalPixelDimensionsEvent.
   * @param {function(PngPhysicalPixelDimensionsEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onPhysicalPixelDimensions(listener) {
    super.addEventListener(PngParseEventType.pHYs, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngSignificantBitsEvent.
   * @param {function(PngSignificantBitsEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onSignificantBits(listener) {
    super.addEventListener(PngParseEventType.sBIT, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngSuggestedPaletteEvent.
   * @param {function(PngSuggestedPaletteEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onSuggestedPalette(listener) {
    super.addEventListener(PngParseEventType.sPLT, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngTextualDataEvent.
   * @param {function(PngTextualDataEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onTextualData(listener) {
    super.addEventListener(PngParseEventType.tEXt, listener);
    return this;
  }

  /**
   * Type-safe way to bind a listener for a PngTransparencyEvent.
   * @param {function(PngTransparencyEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onTransparency(listener) {
    super.addEventListener(PngParseEventType.tRNS, listener);
    return this;
  }

  /** @returns {Promise<void>} A Promise that resolves when the parsing is complete. */
  async start() {
    const sigLength = SIG.byteLength;
    const sig = this.bstream.readBytes(sigLength);
    for (let sb = 0; sb < sigLength; ++sb) {
      if (sig[sb] !== SIG[sb]) throw `Bad PNG signature: ${sig}`;
    }

    /** @type {PngChunk} */
    let chunk;
    do {
      const length = this.bstream.readNumber(4);
      chunk = {
        length,
        chunkType: this.bstream.readString(4),
        chunkStream: this.bstream.tee(),
        crc: this.bstream.skip(length).readNumber(4),
      };

      const chStream = chunk.chunkStream;
      switch (chunk.chunkType) {
        // https://www.w3.org/TR/png-3/#11IHDR
        case 'IHDR':
          if (this.colorType) throw `Found multiple IHDR chunks`;
          /** @type {PngImageHeader} */
          const header = {
            width: chStream.readNumber(4),
            height: chStream.readNumber(4),
            bitDepth: chStream.readNumber(1),
            colorType: chStream.readNumber(1),
            compressionMethod: chStream.readNumber(1),
            filterMethod: chStream.readNumber(1),
            interlaceMethod: chStream.readNumber(1),
          };
          if (!Object.values(PngColorType).includes(header.colorType)) {
            throw `Bad PNG color type: ${header.colorType}`;
          }
          if (header.compressionMethod !== 0) {
            throw `Bad PNG compression method: ${header.compressionMethod}`;
          }
          if (header.filterMethod !== 0) {
            throw `Bad PNG filter method: ${header.filterMethod}`;
          }
          if (!Object.values(PngInterlaceMethod).includes(header.interlaceMethod)) {
            throw `Bad PNG interlace method: ${header.interlaceMethod}`;
          }

          this.colorType = header.colorType;

          this.dispatchEvent(new PngImageHeaderEvent(header));
          break;

        // https://www.w3.org/TR/png-3/#11gAMA
        case 'gAMA':
          if (length !== 4) throw `Bad length for gAMA: ${length}`;
          this.dispatchEvent(new PngImageGammaEvent(chStream.readNumber(4)));
          break;

        // https://www.w3.org/TR/png-3/#11bKGD
        case 'bKGD':
          if (this.colorType === undefined) throw `bKGD before IHDR`;
          if (this.colorType === PngColorType.INDEXED_COLOR && !this.palette) throw `bKGD before PLTE`;
          /** @type {PngBackgroundColor} */
          const bkgdColor = {};

          if (this.colorType === PngColorType.GREYSCALE ||
              this.colorType === PngColorType.GREYSCALE_WITH_ALPHA) {
            bkgdColor.greyscale = chStream.readNumber(2);
          } else if (this.colorType === PngColorType.TRUE_COLOR ||
              this.colorType === PngColorType.TRUE_COLOR_WITH_ALPHA) {
            bkgdColor.red = chStream.readNumber(2);
            bkgdColor.green = chStream.readNumber(2);
            bkgdColor.blue = chStream.readNumber(2);
          } else if (this.colorType === PngColorType.INDEXED_COLOR) {
            bkgdColor.paletteIndex = chStream.readNumber(1);
          }

          this.dispatchEvent(new PngBackgroundColorEvent(bkgdColor));
          break;

        // https://www.w3.org/TR/png-3/#11sBIT
        case 'sBIT':
          if (this.colorType === undefined) throw `sBIT before IHDR`;
          /** @type {PngSignificantBits} */
          const sigBits = {};

          const sbitBadLengthErr = `Weird sBIT length for color type ${this.colorType}: ${length}`;
          if (this.colorType === PngColorType.GREYSCALE) {
            if (length !== 1) throw sbitBadLengthErr;
            sigBits.significant_greyscale = chStream.readNumber(1);
          } else if (this.colorType === PngColorType.TRUE_COLOR ||
              this.colorType === PngColorType.INDEXED_COLOR) {
            if (length !== 3) throw sbitBadLengthErr;
            sigBits.significant_red = chStream.readNumber(1);
            sigBits.significant_green = chStream.readNumber(1);
            sigBits.significant_blue = chStream.readNumber(1);
          } else if (this.colorType === PngColorType.GREYSCALE_WITH_ALPHA) {
            if (length !== 2) throw sbitBadLengthErr;
            sigBits.significant_greyscale = chStream.readNumber(1);
            sigBits.significant_alpha = chStream.readNumber(1);
          } else if (this.colorType === PngColorType.TRUE_COLOR_WITH_ALPHA) {
            if (length !== 4) throw sbitBadLengthErr;
            sigBits.significant_red = chStream.readNumber(1);
            sigBits.significant_green = chStream.readNumber(1);
            sigBits.significant_blue = chStream.readNumber(1);
            sigBits.significant_alpha = chStream.readNumber(1);
          }

          this.dispatchEvent(new PngSignificantBitsEvent(sigBits));
          break;

        // https://www.w3.org/TR/png-3/#11cHRM
        case 'cHRM':
          if (length !== 32) throw `Weird length for cHRM chunk: ${length}`;

          /** @type {PngChromaticies} */
          const chromaticities = {
            whitePointX: chStream.readNumber(4),
            whitePointY: chStream.readNumber(4),
            redX: chStream.readNumber(4),
            redY: chStream.readNumber(4),
            greenX: chStream.readNumber(4),
            greenY: chStream.readNumber(4),
            blueX: chStream.readNumber(4),
            blueY: chStream.readNumber(4),
          };
          this.dispatchEvent(new PngChromaticitiesEvent(chromaticities));
          break;

        // https://www.w3.org/TR/png-3/#11PLTE
        case 'PLTE':
          if (this.colorType === undefined) throw `PLTE before IHDR`;
          if (this.colorType === PngColorType.GREYSCALE ||
              this.colorType === PngColorType.GREYSCALE_WITH_ALPHA) throw `PLTE with greyscale`;
          if (length % 3 !== 0) throw `PLTE length was not divisible by 3`;

          /** @type {PngColor[]} */
          const paletteEntries = [];
          for (let p = 0; p < length / 3; ++p) {
            paletteEntries.push({
              red: chStream.readNumber(1),
              green: chStream.readNumber(1),
              blue: chStream.readNumber(1),
            });
          }

          /** @type {PngPalette} */
          this.palette = {
            entries: paletteEntries,
          };

          this.dispatchEvent(new PngPaletteEvent(this.palette));
          break;

        // https://www.w3.org/TR/png-3/#11pHYs
        case 'pHYs':
          /** @type {physicalPixelDimensions} */
          const pixelDims = {
            pixelPerUnitX: chStream.readNumber(4),
            pixelPerUnitY: chStream.readNumber(4),
            unitSpecifier: chStream.readNumber(1),
          };
          if (!Object.values(PngUnitSpecifier).includes(pixelDims.unitSpecifier)) {
            throw `Bad pHYs unit specifier: ${pixelDims.unitSpecifier}`;
          }

          this.dispatchEvent(new PngPhysicalPixelDimensionsEvent(pixelDims));
          break;

        // https://www.w3.org/TR/png-3/#11tEXt
        case 'tEXt':
          const byteArr = chStream.peekBytes(length);
          const nullIndex = byteArr.indexOf(0);
          /** @type {PngTextualData} */
          const textualData = {
            keyword: chStream.readString(nullIndex),
            textString: chStream.skip(1).readString(length - nullIndex - 1),
          };
          this.dispatchEvent(new PngTextualDataEvent(textualData));
          break;

        // https://www.w3.org/TR/png-3/#11tIME
        case 'tIME':
          /** @type {PngLastModTime} */
          const lastModTime = {
            year: chStream.readNumber(2),
            month: chStream.readNumber(1),
            day: chStream.readNumber(1),
            hour: chStream.readNumber(1),
            minute: chStream.readNumber(1),
            second: chStream.readNumber(1),
          };
          this.dispatchEvent(new PngLastModTimeEvent(lastModTime));
          break;

        // https://www.w3.org/TR/png-3/#11tRNS
        case 'tRNS':
          if (this.colorType === undefined) throw `tRNS before IHDR`;
          if (this.colorType === PngColorType.GREYSCALE_WITH_ALPHA ||
              this.colorType === PngColorType.TRUE_COLOR_WITH_ALPHA) {
            throw `tRNS with color type ${this.colorType}`;
          }

          /** @type {PngTransparency} */
          const transparency = {};

          const trnsBadLengthErr = `Weird sBIT length for color type ${this.colorType}: ${length}`;
          if (this.colorType === PngColorType.GREYSCALE) {
            if (length !== 2) throw trnsBadLengthErr;
            transparency.greySampleValue = chStream.readNumber(2);
          } else if (this.colorType === PngColorType.TRUE_COLOR) {
            if (length !== 6) throw trnsBadLengthErr;
            // Oddly the order is RBG instead of RGB :-/
            transparency.redSampleValue = chStream.readNumber(2);
            transparency.blueSampleValue = chStream.readNumber(2);
            transparency.greenSampleValue = chStream.readNumber(2);
          } else if (this.colorType === PngColorType.INDEXED_COLOR) {
            if (!this.palette) throw `tRNS before PLTE`;
            if (length > this.palette.entries.length) throw `More tRNS entries than palette`;

            transparency.alphaPalette = [];
            for (let a = 0; a < length; ++a) {
              transparency.alphaPalette.push(chStream.readNumber(1));
            }
          }

          this.dispatchEvent(new PngTransparencyEvent(transparency));
          break;

        // https://www.w3.org/TR/png-3/#11zTXt
        case 'zTXt':
          const compressedByteArr = chStream.peekBytes(length);
          const compressedNullIndex = compressedByteArr.indexOf(0);

          /** @type {PngCompressedTextualData} */
          const compressedTextualData = {
            keyword: chStream.readString(compressedNullIndex),
            compressionMethod: chStream.skip(1).readNumber(1),
            compressedText: chStream.readBytes(length - compressedNullIndex - 2),
          };
          this.dispatchEvent(new PngCompressedTextualDataEvent(compressedTextualData));
          break;

        // https://www.w3.org/TR/png-3/#11iTXt
        case 'iTXt':
          const intlByteArr = chStream.peekBytes(length);
          const intlNull0 = intlByteArr.indexOf(0);
          const intlNull1 = intlByteArr.indexOf(0, intlNull0 + 1);
          const intlNull2 = intlByteArr.indexOf(0, intlNull1 + 1);
          if (intlNull0 === -1) throw `iTXt: Did not have one null`;
          if (intlNull1 === -1) throw `iTXt: Did not have two nulls`;
          if (intlNull2 === -1) throw `iTXt: Did not have three nulls`;

          /** @type {PngIntlTextualData} */
          const intlTextData = {
            keyword: chStream.readString(intlNull0),
            compressionFlag: chStream.skip(1).readNumber(1),
            compressionMethod: chStream.readNumber(1),
            languageTag: (intlNull1 - intlNull0 > 1) ? chStream.readString(intlNull1 - intlNull0 - 1) : undefined,
            translatedKeyword: (intlNull2 - intlNull1 > 1) ? chStream.skip(1).readString(intlNull2 - intlNull1 - 1) : undefined,
            text: chStream.skip(1).readBytes(length - intlNull2 - 1),
          };

          this.dispatchEvent(new PngIntlTextualDataEvent(intlTextData));
          break;

        // https://www.w3.org/TR/png-3/#eXIf
        case 'eXIf':
          const exifValueMap = getExifProfile(chStream);
          this.dispatchEvent(new PngExifProfileEvent(exifValueMap));
          break;

        // https://www.w3.org/TR/png-3/#11hIST
        case 'hIST':
          if (!this.palette) throw `hIST before PLTE`;
          if (length !== this.palette.entries.length * 2) throw `Bad # of hIST frequencies: ${length / 2}`;

          /** @type {PngHistogram} */
          const hist = { frequencies: [] };
          for (let f = 0; f < this.palette.entries.length; ++f) {
            hist.frequencies.push(chStream.readNumber(2));
          }

          this.dispatchEvent(new PngHistogramEvent(hist));
          break;

        // https://www.w3.org/TR/png-3/#11sPLT
        case 'sPLT':
          const spByteArr = chStream.peekBytes(length);
          const spNameNullIndex = spByteArr.indexOf(0);

          /** @type {PngSuggestedPalette} */
          const sPalette = {
            paletteName: chStream.readString(spNameNullIndex),
            sampleDepth: chStream.skip(1).readNumber(1),
            entries: [],
          };

          const sampleDepth = sPalette.sampleDepth;
          if (![8, 16].includes(sampleDepth)) throw `Invalid sPLT sample depth: ${sampleDepth}`;

          const remainingByteLength = length - spNameNullIndex - 1 - 1;
          const compByteLength = sPalette.sampleDepth === 8 ? 1 : 2;
          const entryByteLength = 4 * compByteLength + 2;
          if (remainingByteLength % entryByteLength !== 0) {
            throw `Invalid # of bytes left in sPLT: ${remainingByteLength}`;
          }

          const numEntries = remainingByteLength / entryByteLength;
          for (let e = 0; e < numEntries; ++e) {
            sPalette.entries.push({
              red: chStream.readNumber(compByteLength),
              green: chStream.readNumber(compByteLength),
              blue: chStream.readNumber(compByteLength),
              alpha: chStream.readNumber(compByteLength),
              frequency: chStream.readNumber(2),
            });
          }

          this.dispatchEvent(new PngSuggestedPaletteEvent(sPalette));
          break;

        // https://www.w3.org/TR/png-3/#11IDAT
        case 'IDAT':
          /** @type {PngImageData} */
          const data = {
            rawImageData: chStream.readBytes(chunk.length),
          };
          this.dispatchEvent(new PngImageDataEvent(data));
          break;

        case 'IEND':
          break;

        default:
          if (DEBUG) console.log(`Found an unhandled chunk: ${chunk.chunkType}`);
          break;
      }
    } while (chunk.chunkType !== 'IEND');
  }
}

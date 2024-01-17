/*
 * png.js
 *
 * An event-based parser for PNG images.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */

import * as fs from 'node:fs'; // TODO: Remove.
import { ByteStream } from '../../io/bytestream.js';

// https://www.w3.org/TR/2003/REC-PNG-20031110
// https://en.wikipedia.org/wiki/PNG#File_format

// TODO: Ancillary chunks bKGD, cHRM, hIST, iTXt, pHYs, sPLT, tEXt, tIME, zTXt.

// let DEBUG = true;
let DEBUG = false;
const SIG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

/** @enum {string} */
export const PngParseEventType = {
  IHDR: 'image_header',
  gAMA: 'image_gamma',
  sBIT: 'significant_bits',
  PLTE: 'palette',
  tRNS: 'transparency',
  IDAT: 'image_data',
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
  /** @param {PngPalette} */
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
  /** @param {PngTransparency} */
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
  /** @param {PngImageData} */
  constructor(data) {
    super(PngParseEventType.IDAT);
    /** @type {PngImageData} */
    this.data = data;
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
   * Type-safe way to bind a listener for a PngImageHeaderEvent.
   * @param {function(PngImageHeaderEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onImageHeader(listener) {
    super.addEventListener(PngParseEventType.IHDR, listener);
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
   * Type-safe way to bind a listener for a PngSignificantBitsEvent.
   * @param {function(PngSignificantBitsEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onSignificantBits(listener) {
    super.addEventListener(PngParseEventType.sBIT, listener);
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
   * Type-safe way to bind a listener for a PngTransparencyEvent.
   * @param {function(PngTransparencyEvent): void} listener
   * @returns {PngParser} for chaining
   */
  onTransparency(listener) {
    super.addEventListener(PngParseEventType.tRNS, listener);
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
        // https://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR
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

        // https://www.w3.org/TR/2003/REC-PNG-20031110/#11gAMA
        case 'gAMA':
          if (length !== 4) throw `Bad length for gAMA: ${length}`;
          this.dispatchEvent(new PngImageGammaEvent(chStream.readNumber(4)));
          break;

        // https://www.w3.org/TR/2003/REC-PNG-20031110/#11sBIT
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

        // https://www.w3.org/TR/2003/REC-PNG-20031110/#11PLTE
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

        // https://www.w3.org/TR/2003/REC-PNG-20031110/#11tRNS
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

        // https://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT
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

const FILES = `PngSuite.png	basn0g04.png	bggn4a16.png	cs8n2c08.png	f03n2c08.png	g10n3p04.png	s01i3p01.png	s32i3p04.png	tbbn0g04.png	xd0n2c08.png
basi0g01.png	basn0g08.png	bgwn6a08.png	cs8n3p08.png	f04n0g08.png	g25n0g16.png	s01n3p01.png	s32n3p04.png	tbbn2c16.png	xd3n2c08.png
basi0g02.png	basn0g16.png	bgyn6a16.png	ct0n0g04.png	f04n2c08.png	g25n2c08.png	s02i3p01.png	s33i3p04.png	tbbn3p08.png	xd9n2c08.png
basi0g04.png	basn2c08.png	ccwn2c08.png	ct1n0g04.png	f99n0g04.png	g25n3p04.png	s02n3p01.png	s33n3p04.png	tbgn2c16.png	xdtn0g01.png
basi0g08.png	basn2c16.png	ccwn3p08.png	cten0g04.png	g03n0g16.png	oi1n0g16.png	s03i3p01.png	s34i3p04.png	tbgn3p08.png	xhdn0g08.png
basi0g16.png	basn3p01.png	cdfn2c08.png	ctfn0g04.png	g03n2c08.png	oi1n2c16.png	s03n3p01.png	s34n3p04.png	tbrn2c08.png	xlfn0g04.png
basi2c08.png	basn3p02.png	cdhn2c08.png	ctgn0g04.png	g03n3p04.png	oi2n0g16.png	s04i3p01.png	s35i3p04.png	tbwn0g16.png	xs1n0g01.png
basi2c16.png	basn3p04.png	cdsn2c08.png	cthn0g04.png	g04n0g16.png	oi2n2c16.png	s04n3p01.png	s35n3p04.png	tbwn3p08.png	xs2n0g01.png
basi3p01.png	basn3p08.png	cdun2c08.png	ctjn0g04.png	g04n2c08.png	oi4n0g16.png	s05i3p02.png	s36i3p04.png	tbyn3p08.png	xs4n0g01.png
basi3p02.png	basn4a08.png	ch1n3p04.png	ctzn0g04.png	g04n3p04.png	oi4n2c16.png	s05n3p02.png	s36n3p04.png	tm3n3p02.png	xs7n0g01.png
basi3p04.png	basn4a16.png	ch2n3p08.png	exif2c08.png	g05n0g16.png	oi9n0g16.png	s06i3p02.png	s37i3p04.png	tp0n0g08.png	z00n2c08.png
basi3p08.png	basn6a08.png	cm0n0g04.png	f00n0g08.png	g05n2c08.png	oi9n2c16.png	s06n3p02.png	s37n3p04.png	tp0n2c08.png	z03n2c08.png
basi4a08.png	basn6a16.png	cm7n0g04.png	f00n2c08.png	g05n3p04.png	pp0n2c16.png	s07i3p02.png	s38i3p04.png	tp0n3p08.png	z06n2c08.png
basi4a16.png	bgai4a08.png	cm9n0g04.png	f01n0g08.png	g07n0g16.png	pp0n6a08.png	s07n3p02.png	s38n3p04.png	tp1n3p08.png	z09n2c08.png
basi6a08.png	bgai4a16.png	cs3n2c16.png	f01n2c08.png	g07n2c08.png	ps1n0g08.png	s08i3p02.png	s39i3p04.png	xc1n0g08.png
basi6a16.png	bgan6a08.png	cs3n3p08.png	f02n0g08.png	g07n3p04.png	ps1n2c16.png	s08n3p02.png	s39n3p04.png	xc9n2c08.png
basn0g01.png	bgan6a16.png	cs5n2c08.png	f02n2c08.png	g10n0g16.png	ps2n0g08.png	s09i3p02.png	s40i3p04.png	xcrn0g04.png
basn0g02.png	bgbn4a08.png	cs5n3p08.png	f03n0g08.png	g10n2c08.png	ps2n2c16.png	s09n3p02.png	s40n3p04.png	xcsn0g01.png`
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(fn => `tests/image-testfiles/${fn}`);

async function main() {
  for (const fileName of FILES) {
    console.log(`file: ${fileName}`);
    const nodeBuf = fs.readFileSync(fileName);
    const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
    const parser = new PngParser(ab);
    parser.onImageHeader(evt => {
      // console.dir(evt.imageHeader);
    });
    parser.onGamma(evt => {
      // console.dir(evt.imageGamma);
    });
    parser.onSignificantBits(evt => {
      // console.dir(evt.sigBits);
    });
    parser.onPalette(evt => {
      // console.dir(evt.palette);
    });
    parser.onTransparency(evt => {
      // console.dir(evt.transparency);
    });
    parser.onImageData(evt => {
      // console.dir(evt);
    });

    try {
      await parser.start();
    } catch (err) {
      if (!fileName.startsWith('tests/image-testfiles/x')) throw err;
    }
  }
}

// main();
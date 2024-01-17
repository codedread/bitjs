import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';
import { PngColorType, PngInterlaceMethod, PngParser } from '../image/parsers/png.js';

/** @typedef {import('../image/parsers/png.js').PngImageData} PngImageData */
/** @typedef {import('../image/parsers/png.js').PngImageGamma} PngImageGamma */
/** @typedef {import('../image/parsers/png.js').PngImageHeader} PngImageHeader */
/** @typedef {import('../image/parsers/png.js').PngPalette} PngPalette */
/** @typedef {import('../image/parsers/png.js').PngSignificantBits} PngSignificantBits */

function getPngParser(fileName) {
  const nodeBuf = fs.readFileSync(fileName);
  const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
  return new PngParser(ab);
}

describe('bitjs.image.parsers.PngParser', () => {
  describe('IHDR', () => {
    it('extracts IHDR', async () => {
      /** @type {PngImageHeader} */
      let header;

      await getPngParser('tests/image-testfiles/PngSuite.png')
          .onImageHeader(evt => { header = evt.imageHeader })
          .start();

      expect(header.width).equals(256);
      expect(header.height).equals(256);
      expect(header.bitDepth).equals(8);
      expect(header.colorType).equals(PngColorType.TRUE_COLOR);
      expect(header.compressionMethod).equals(0);
      expect(header.filterMethod).equals(0);
      expect(header.interlaceMethod).equals(PngInterlaceMethod.NO_INTERLACE);
    });

    it('throws on corrupt signature', async () => {
      /** @type {PngImageHeader} */
      let header;

      try {
        await getPngParser('tests/image-testfiles/xs1n0g01.png')
            .onImageHeader(evt => { header = evt.imageHeader })
            .start();
        throw new Error(`PngParser did not throw an error for corrupt PNG signature`);
      } catch (err) {
        expect(err.startsWith('Bad PNG signature')).equals(true);
      }
    });
  });

  it('extracts gAMA', async () => {
    /** @type {number} */
    let gamma;
    await getPngParser('tests/image-testfiles/g05n3p04.png')
        .onGamma(evt => gamma = evt.gamma)
        .start();
    expect(gamma).equals(55000);
  });

  it('extracts sBIT', async () => {
    /** @type {PngSignificantBits} */
    let sBits;
    await getPngParser('tests/image-testfiles/cs3n2c16.png')
        .onSignificantBits(evt => sBits = evt.sigBits)
        .start();
    expect(sBits.significant_red).equals(13);
    expect(sBits.significant_green).equals(13);
    expect(sBits.significant_blue).equals(13);
    expect(sBits.significant_greyscale).equals(undefined);
    expect(sBits.significant_alpha).equals(undefined);
  });

  it('extracts PLTE', async () => {
    /** @type {PngPalette} */
    let palette;
    await getPngParser('tests/image-testfiles/tbbn3p08.png')
        .onPalette(evt => palette = evt.palette)
        .start();
    expect(palette.entries.length).equals(246);
    const entry = palette.entries[1];
    expect(entry.red).equals(128);
    expect(entry.green).equals(86);
    expect(entry.blue).equals(86);
  });

  it('extracts IDAT', async () => {
    /** @type {PngImageData} */
    let data;

    await getPngParser('tests/image-testfiles/PngSuite.png')
        .onImageData(evt => { data = evt.data })
        .start();

    expect(data.rawImageData.byteLength).equals(2205);
    expect(data.rawImageData[0]).equals(120);
  });
});

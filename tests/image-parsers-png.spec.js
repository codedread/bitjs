import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';
import { PngColorType, PngInterlaceMethod, PngParser } from '../image/parsers/png.js';
import { fail } from 'node:assert';

/** @typedef {import('../image/parsers/png.js').PngImageHeader} PngImageHeader */
/** @typedef {import('../image/parsers/png.js').PngImageData} PngImageData */

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

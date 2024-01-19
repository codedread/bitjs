import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';
import { PngColorType, PngInterlaceMethod, PngUnitSpecifier, PngParser } from '../image/parsers/png.js';
import { ExifDataFormat, ExifTagNumber } from '../image/parsers/exif.js';

/** @typedef {import('../image/parsers/exif.js').ExifValue} ExifValue */

/** @typedef {import('../image/parsers/png.js').PngBackgroundColor} PngBackgroundColor */
/** @typedef {import('../image/parsers/png.js').PngChromaticities} PngChromaticies */
/** @typedef {import('../image/parsers/png.js').PngCompressedTextualData} PngCompressedTextualData */
/** @typedef {import('../image/parsers/png.js').PngHistogram} PngHistogram */
/** @typedef {import('../image/parsers/png.js').PngImageData} PngImageData */
/** @typedef {import('../image/parsers/png.js').PngImageGamma} PngImageGamma */
/** @typedef {import('../image/parsers/png.js').PngImageHeader} PngImageHeader */
/** @typedef {import('../image/parsers/png.js').PngIntlTextualData} PngIntlTextualData */
/** @typedef {import('../image/parsers/png.js').PngLastModTime} PngLastModTime */
/** @typedef {import('../image/parsers/png.js').PngPalette} PngPalette */
/** @typedef {import('../image/parsers/png.js').PngPhysicalPixelDimensions} PngPhysicalPixelDimensions */
/** @typedef {import('../image/parsers/png.js').PngSignificantBits} PngSignificantBits */
/** @typedef {import('../image/parsers/png.js').PngSuggestedPalette} PngSuggestedPalette */
/** @typedef {import('../image/parsers/png.js').PngTextualData} PngTextualData */
/** @typedef {import('../image/parsers/png.js').PngTransparency} PngTransparency */

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
          .onImageHeader(evt => { header = evt.detail })
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
            .onImageHeader(evt => { header = evt.detail })
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
        .onGamma(evt => gamma = evt.detail)
        .start();
    expect(gamma).equals(55000);
  });

  it('extracts sBIT', async () => {
    /** @type {PngSignificantBits} */
    let sBits;
    await getPngParser('tests/image-testfiles/cs3n2c16.png')
        .onSignificantBits(evt => sBits = evt.detail)
        .start();
    expect(sBits.significant_red).equals(13);
    expect(sBits.significant_green).equals(13);
    expect(sBits.significant_blue).equals(13);
    expect(sBits.significant_greyscale).equals(undefined);
    expect(sBits.significant_alpha).equals(undefined);
  });

  it('extracts cHRM', async () => {
    /** @type {PngChromaticies} */
    let chromaticities;
    await getPngParser('tests/image-testfiles/ccwn2c08.png')
        .onChromaticities(evt => chromaticities = evt.detail)
        .start();
    expect(chromaticities.whitePointX).equals(31270);
    expect(chromaticities.whitePointY).equals(32900);
    expect(chromaticities.redX).equals(64000);
    expect(chromaticities.redY).equals(33000);
    expect(chromaticities.greenX).equals(30000);
    expect(chromaticities.greenY).equals(60000);
    expect(chromaticities.blueX).equals(15000);
    expect(chromaticities.blueY).equals(6000);
  });

  it('extracts PLTE', async () => {
    /** @type {PngPalette} */
    let palette;
    await getPngParser('tests/image-testfiles/tbbn3p08.png')
        .onPalette(evt => palette = evt.detail)
        .start();
    expect(palette.entries.length).equals(246);
    const entry = palette.entries[1];
    expect(entry.red).equals(128);
    expect(entry.green).equals(86);
    expect(entry.blue).equals(86);
  });

  describe('tRNS', () => {
    it('extracts alpha palette', async () => {
      /** @type {PngTransparency} */
      let transparency;
      await getPngParser('tests/image-testfiles/tbbn3p08.png')
          .onTransparency(evt => transparency = evt.detail)
          .start();

      expect(transparency.alphaPalette.length).equals(1);
      expect(transparency.alphaPalette[0]).equals(0);
    });

    it('extracts 8-bit RGB transparency', async () => {
      /** @type {PngTransparency} */
      let transparency;
      await getPngParser('tests/image-testfiles/tbrn2c08.png')
          .onTransparency(evt => transparency = evt.detail)
          .start();

      expect(transparency.redSampleValue).equals(255);
      expect(transparency.blueSampleValue).equals(255);
      expect(transparency.greenSampleValue).equals(255);
    });

    it('extracts 16-bit RGB transparency', async () => {
      /** @type {PngTransparency} */
      let transparency;
      await getPngParser('tests/image-testfiles/tbgn2c16.png')
          .onTransparency(evt => transparency = evt.detail)
          .start();

      expect(transparency.redSampleValue).equals(65535);
      expect(transparency.blueSampleValue).equals(65535);
      expect(transparency.greenSampleValue).equals(65535);
    });
  });

  it('extracts IDAT', async () => {
    /** @type {PngImageData} */
    let data;

    await getPngParser('tests/image-testfiles/PngSuite.png')
        .onImageData(evt => { data = evt.detail })
        .start();

    expect(data.rawImageData.byteLength).equals(2205);
    expect(data.rawImageData[0]).equals(120);
  });

  it('extracts tEXt', async () => {
    /** @type {PngTextualData[]} */
    let textualDataArr = [];

    await getPngParser('tests/image-testfiles/ctzn0g04.png')
        .onTextualData(evt => { textualDataArr.push(evt.detail) })
        .start();

    expect(textualDataArr.length).equals(2);
    expect(textualDataArr[0].keyword).equals('Title');
    expect(textualDataArr[0].textString).equals('PngSuite');
    expect(textualDataArr[1].keyword).equals('Author');
    expect(textualDataArr[1].textString).equals('Willem A.J. van Schaik\n(willem@schaik.com)');
  });

  it('extracts zTXt', async () => {
    /** @type {PngCompressedTextualData} */
    let data;

    await getPngParser('tests/image-testfiles/ctzn0g04.png')
        .onCompressedTextualData(evt => { data = evt.detail })
        .start();
    
    expect(data.keyword).equals('Disclaimer');
    expect(data.compressionMethod).equals(0);
    expect(data.compressedText.byteLength).equals(17);

    const blob = new Blob([data.compressedText.buffer]);
    const decompressedStream = blob.stream().pipeThrough(new DecompressionStream('deflate'));
    const decompressedText = await new Response(decompressedStream).text();
    expect(decompressedText).equals('Freeware.');
  });

  it('extracts iTXt', async () => {
    /** @type {PngIntlTextualData[]} */
    let data = [];

    await getPngParser('tests/image-testfiles/ctjn0g04.png')
        .onIntlTextualData(evt => { data.push(evt.detail) })
        .start();

    expect(data.length).equals(6);
    expect(data[1].keyword).equals('Author');
    expect(data[1].compressionFlag).equals(0)
    expect(data[5].keyword).equals('Disclaimer');
    // TODO: Test this better!
  });

  describe('bKGD', () => {
    it('greyscale', async () => {
      /** @type {PngBackgroundColor} */
      let bc;
      await getPngParser('tests/image-testfiles/bggn4a16.png')
          .onBackgroundColor(evt => { bc = evt.detail })
          .start();
      expect(bc.greyscale).equals(43908);
    });

    it('rgb', async () => {
      /** @type {PngBackgroundColor} */
      let bc;
      await getPngParser('tests/image-testfiles/tbrn2c08.png')
          .onBackgroundColor(evt => { bc = evt.detail })
          .start();
      expect(bc.red).equals(255);
      expect(bc.green).equals(0);
      expect(bc.blue).equals(0);
    });

    it('paletteIndex', async () => {
      /** @type {PngBackgroundColor} */
      let bc;
      await getPngParser('tests/image-testfiles/tbbn3p08.png')
          .onBackgroundColor(evt => { bc = evt.detail })
          .start();
      expect(bc.paletteIndex).equals(245);
    });
  });

  it('extracts tIME', async () => {
    /** @type {PngLastModTime} */
    let lastModTime;
    await getPngParser('tests/image-testfiles/cm9n0g04.png')
        .onLastModTime(evt => { lastModTime = evt.detail })
        .start();
    expect(lastModTime.year).equals(1999);
    expect(lastModTime.month).equals(12);
    expect(lastModTime.day).equals(31);
    expect(lastModTime.hour).equals(23);
    expect(lastModTime.minute).equals(59);
    expect(lastModTime.second).equals(59);
  });

  it('extracts pHYs', async () => {
    /** @type {PngPhysicalPixelDimensions} */
    let pixelDims;
    await getPngParser('tests/image-testfiles/cdun2c08.png')
        .onPhysicalPixelDimensions(evt => { pixelDims = evt.detail })
        .start();
    expect(pixelDims.pixelPerUnitX).equals(1000);
    expect(pixelDims.pixelPerUnitY).equals(1000);
    expect(pixelDims.unitSpecifier).equals(PngUnitSpecifier.METRE);
  });

  it('extracts eXIf', async () => {
    /** @type {PngPhysicalPixelDimensions} */
    let exif;
    await getPngParser('tests/image-testfiles/exif2c08.png')
        .onExifProfile(evt => { exif = evt.detail })
        .start();

    const descVal = exif.get(ExifTagNumber.COPYRIGHT);
    expect(descVal.dataFormat).equals(ExifDataFormat.ASCII_STRING);
    expect(descVal.stringValue).equals('2017 Willem van Schaik');
  });

  it('extracts hIST', async () => {
    /** @type {PngPalette} */
    let palette;
    /** @type {PngHistogram} */
    let hist;
    await getPngParser('tests/image-testfiles/ch1n3p04.png')
        .onHistogram(evt => { hist = evt.detail })
        .onPalette(evt => { palette = evt.detail })
        .start();

    expect(hist.frequencies.length).equals(palette.entries.length);
    expect(hist.frequencies[0]).equals(64);
    expect(hist.frequencies[1]).equals(112);
  });

  it('extracts sPLT', async () => {
    /** @type {PngSuggestedPalette} */
    let sPalette;
    await getPngParser('tests/image-testfiles/ps1n0g08.png')
        .onSuggestedPalette(evt => { sPalette = evt.detail })
        .start();

    expect(sPalette.entries.length).equals(216);
    expect(sPalette.paletteName).equals('six-cube');
    expect(sPalette.sampleDepth).equals(8);

    const entry0 = sPalette.entries[0];
    expect(entry0.red).equals(0);
    expect(entry0.green).equals(0);
    expect(entry0.blue).equals(0);
    expect(entry0.alpha).equals(255);
    expect(entry0.frequency).equals(0);

    const entry1 = sPalette.entries[1];
    expect(entry1.red).equals(0);
    expect(entry1.green).equals(0);
    expect(entry1.blue).equals(51);
    expect(entry1.alpha).equals(255);
    expect(entry1.frequency).equals(0);
  });
});

import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';
import { JpegParser } from '../image/parsers/jpeg.js';
import { ExifDataFormat, ExifTagNumber } from '../image/parsers/exif.js';

/** @typedef {import('../image/parsers/jpeg.js').JpegStartOfFrame} JpegStartOfFrame */
/** @typedef {import('../image/parsers/exif.js').ExifValue} ExifValue */

const FILE_LONG_DESC = 'tests/image-testfiles/long_description.jpg'

describe('bitjs.image.parsers.JpegParser', () => {
  it('extracts Exif and SOF', async () => {
    const nodeBuf = fs.readFileSync(FILE_LONG_DESC);
    const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);

    /** @type {Map<number, ExifValue} */
    let exif;
    /** @type {JpegStartOfFrame} */
    let sof;

    const parser = new JpegParser(ab)
        .onApp1Exif(evt => { exif = evt.detail })
        .onStartOfFrame(evt => { sof = evt.detail });
    await parser.start();

    const descVal = exif.get(ExifTagNumber.IMAGE_DESCRIPTION);
    expect(descVal.dataFormat).equals(ExifDataFormat.ASCII_STRING);

    const LONG_DESC = 'Operation Mountain Viper put the soldiers of A Company, 2nd Battalion 22nd '
      + 'Infantry Division, 10th Mountain in the Afghanistan province of Daychopan to search for '
      + 'Taliban and or weapon caches that could be used against U.S. and allied forces. Soldiers '
      + 'quickly walk to the ramp of the CH-47 Chinook cargo helicopter that will return them to '
      + 'Kandahar Army Air Field.  (U.S. Army photo by Staff Sgt. Kyle Davis) (Released)';
    expect(descVal.stringValue).equals(LONG_DESC);
    expect(exif.get(ExifTagNumber.EXIF_IMAGE_HEIGHT).numericalValue).equals(sof.imageHeight);
    expect(exif.get(ExifTagNumber.EXIF_IMAGE_WIDTH).numericalValue).equals(sof.imageWidth);
  });
});

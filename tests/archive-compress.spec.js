import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';
import { getUnarchiver } from '../archive/decompress.js';
import { CompressStatus, Zipper } from '../archive/compress.js';
import { ZipCompressionMethod } from '../archive/common.js';

/**
 * @typedef {import('./archive/compress.js').FileInfo} FileInfo
 */

const PATH = `tests/archive-testfiles/`;

const INPUT_FILENAMES = [
  'sample-1.txt',
  'sample-2.csv',
  'sample-3.json',
];

describe('bitjs.archive.compress', () => {
  /** @type {Map<string, FileInfo>} */
  let inputFileInfos = new Map();
  let decompressedFileSize = 0;

  before(() => {
    for (const fileName of INPUT_FILENAMES) {
      const fullFilename = `${PATH}${fileName}`;
      const fd = fs.openSync(fullFilename, 'r');
      const lastModTime = fs.fstatSync(fd).mtimeMs;
      const nodeBuf = fs.readFileSync(fullFilename);
      const fileData = new Uint8Array(
          nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length));
      inputFileInfos.set(fileName, {fileName, lastModTime, fileData});
      decompressedFileSize += fileData.byteLength;
      fs.closeSync(fd);
    }
  });

  it('zipper throws for invalid compression method', async () => {
    expect(() => new Zipper({zipCompressionMethod: 42})).throws();
  });

  it('zipper works for STORE', (done) => {
    const files = new Map(inputFileInfos);
    const zipper = new Zipper({zipCompressionMethod: ZipCompressionMethod.STORE});
    zipper.start(Array.from(files.values()), true).then(byteArray => {
      expect(zipper.compressState).equals(CompressStatus.COMPLETE);
      expect(byteArray.byteLength > decompressedFileSize).equals(true);

      const unarchiver = getUnarchiver(byteArray.buffer);
      unarchiver.addEventListener('extract', evt => {
        const {filename, fileData} = evt.unarchivedFile;
        expect(files.has(filename)).equals(true);
        const inputFile = files.get(filename).fileData;
        expect(inputFile.byteLength).equals(fileData.byteLength);
        for (let b = 0; b < inputFile.byteLength; ++b) {
          expect(inputFile[b]).equals(fileData[b]);
        }
      });
      unarchiver.addEventListener('finish', evt => done());
      unarchiver.start();
    });
  });

  try {
    new CompressionStream('deflate-raw');

    it('zipper works for DEFLATE, where deflate-raw is supported', async () => {
      const files = new Map(inputFileInfos);
      const zipper = new Zipper({zipCompressionMethod: ZipCompressionMethod.DEFLATE});
      const byteArray = await zipper.start(Array.from(files.values()), true);

      expect(zipper.compressState).equals(CompressStatus.COMPLETE);
      expect(byteArray.byteLength < decompressedFileSize).equals(true);

      const unarchiver = getUnarchiver(byteArray.buffer);
      unarchiver.addEventListener('extract', evt => {
        const {filename, fileData} = evt.unarchivedFile;
        expect(files.has(filename)).equals(true);
        const inputFile = files.get(filename).fileData;
        expect(inputFile.byteLength).equals(fileData.byteLength);
        for (let b = 0; b < inputFile.byteLength; ++b) {
          expect(inputFile[b]).equals(fileData[b]);
        }
      });
      await unarchiver.start();
    });
  } catch (err) {
    // Do nothing. This runtime did not support DEFLATE. (Node < 21.2.0)
  }
});

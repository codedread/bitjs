import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';

import { Gunzipper, Unarchiver, getUnarchiver } from '../archive/decompress.js';

const PATH = `tests/archive-testfiles/`;

const INPUT_FILES = [
  'sample-1.txt',
  'sample-2.csv',
  'sample-3.json',
];

const ARCHIVE_FILES = [
  // rar a -m0 -ma4 archive-rar-store.rar sample*
  'archive-rar-store.rar',
  // rar a -m3 -ma4 archive-rar-default.rar sample*
  'archive-rar-default.rar',
  // rar a -m5 -ma4 archive-rar-smaller.rar sample*
  'archive-rar-smaller.rar',
  'archive-tar.tar',
  'archive-zip-store.zip',
  'archive-zip-faster.zip',
  'archive-zip-smaller.zip',
];

describe('bitjs.archive.decompress', () => {
  /** @type {Map<string, ArrayBuffer>} */
  let inputArrayBuffers = new Map();

  for (const inputFile of INPUT_FILES) {
    const nodeBuf = fs.readFileSync(`${PATH}${inputFile}`);
    const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
    inputArrayBuffers.set(inputFile, ab);
  }

  for (const outFile of ARCHIVE_FILES) {
    it(outFile, async () => {
      const bufs = new Map(inputArrayBuffers);
      const nodeBuf = fs.readFileSync(`${PATH}${outFile}`);
      const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
      let unarchiver = getUnarchiver(ab);
      expect(unarchiver instanceof Unarchiver).equals(true);
      let extractEvtFiredForAddEventListener = false;
      let extractEvtFiredForOnExtract = false;
  
      unarchiver.addEventListener('extract', evt => {
        extractEvtFiredForAddEventListener = true;
        const {filename, fileData} = evt.unarchivedFile;
        expect(bufs.has(filename)).equals(true);
        const ab = bufs.get(filename);
        expect(fileData.byteLength).equals(ab.byteLength);
        for (let b = 0; b < fileData.byteLength; ++b) {
          expect(fileData[b] === ab[b]);
        }
        // Remove the value from the map so that it is only used once.
        bufs.delete(filename);
      });
      unarchiver.onExtract(evt => {
        extractEvtFiredForOnExtract = true;
        expect(evt.unarchivedFile.filename.length > 0).equals(true);
      })

      await unarchiver.start();
      expect(extractEvtFiredForAddEventListener).equals(true);
      expect(extractEvtFiredForOnExtract).equals(true);
    });
  }

  describe('gunzip', () => {
    it('can gunzip a file', async () => {
      const bufs = new Map(inputArrayBuffers);
      const nodeBuf = fs.readFileSync(`${PATH}sample-1-slowest.txt.gz`);
      const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
      let gunzipper = getUnarchiver(ab, {debug: true});
      expect(gunzipper instanceof Gunzipper).equals(true);
      let extractEvtFiredForOnExtract = false;

      gunzipper.onExtract(evt => {
        extractEvtFiredForOnExtract = true;
        const {filename, fileData} = evt.unarchivedFile;
        expect(filename).equals('sample-1.txt');

        const ab = bufs.get('sample-1.txt');
        expect(fileData.byteLength).equals(ab.byteLength);
        for (let b = 0; b < fileData.byteLength; ++b) {
          expect(fileData[b] === ab[b]);
        }
      });

      await gunzipper.start();
      expect(extractEvtFiredForOnExtract).equals(true);
    });
  });
});

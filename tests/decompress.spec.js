import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';

import { Unarchiver, Unrarrer, Untarrer, Unzipper, getUnarchiver } from '../archive/decompress.js';

const PATH = `tests/archive-testfiles/`;

const INPUT_FILES = [
  'sample-1.txt',
  'sample-2.csv',
  'sample-3.json',
];

const ARCHIVE_FILES = [
  'archive-rar-store.rar',
  'archive-rar-default.rar',
  'archive-rar-smaller.rar',
  'archive-rar-ma4.rar',
  'archive-rar-ma5.rar',
  'archive-tar.tar',
  'archive-zip-store.zip',
  'archive-zip-faster.zip',
  'archive-zip-smaller.zip',
];

describe('bitjs.archive.decompress', () => {
  /** @type {Map<string, ArrayBuffer>} */
  let inputArrayBuffers = new Map();

  before(() => {
    for (const inputFile of INPUT_FILES) {
      const nodeBuf = fs.readFileSync(`${PATH}${inputFile}`);
      const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
      inputArrayBuffers.set(inputFile, ab);
    }
  });

  for (const outFile of ARCHIVE_FILES) {
    it(outFile, (done) => {
      const bufs = new Map(inputArrayBuffers);
      const nodeBuf = fs.readFileSync(`${PATH}${outFile}`);
      const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);
      let unarchiver = getUnarchiver(ab);
      expect(unarchiver instanceof Unarchiver).equals(true);
  
      unarchiver.addEventListener('extract', evt => {
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
      unarchiver.start().then(() => { done() });
    });
  }
});

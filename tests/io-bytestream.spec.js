/*
 * archive-test.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 */

import { ByteStream } from '../io/bytestream.js';
import 'mocha';
import { expect } from 'chai';

describe('bitjs.io.ByteStream', () => {

  let array;
  beforeEach(() => {
    array = new Uint8Array(4);
  });

  it('throws an error without an ArrayBuffer', () => {
    expect(() => new ByteStream()).throws();
    expect(() => new ByteStream(array.buffer).push()).throws();
  });

  it('getNumBytesRead() works', () => {
    const stream = new ByteStream(array.buffer);
    expect(stream.getNumBytesRead()).equals(0);
    stream.readBytes(1);
    expect(stream.getNumBytesRead()).equals(1);
    stream.readBytes(2);
    expect(stream.getNumBytesRead()).equals(3);
  });

  it('throws when peeking a weird numbers of bytes', () => {
    array[0] = 255;
    const stream = new ByteStream(array.buffer);
    expect(stream.peekNumber(0)).equals(0);
    expect(() => stream.peekNumber(-2)).throws();
    expect(() => stream.peekNumber(5)).throws();

    expect(stream.peekBytes(0).length).equals(0);
    expect(() => stream.peekBytes(-1)).throws();

    expect(stream.peekString(0)).equals('');
    expect(() => stream.peekString(-1)).throws();
    expect(() => stream.peekString(5)).throws();
  });

  it('PeekAndRead_SingleByte', () => {
    array[0] = 192;
    const stream = new ByteStream(array.buffer);
    expect(stream.peekNumber(1)).equals(192);
    expect(stream.readNumber(1)).equals(192);
  });

  it('PeekAndRead_MultiByteNumber', () => {
    array[0] = (1234 & 0xff);
    array[1] = ((1234 >> 8) & 0xff);
    const stream = new ByteStream(array.buffer);
    expect(stream.peekNumber(4)).equals(1234);
    expect(stream.readNumber(4)).equals(1234);
    expect(() => stream.readNumber(1)).to.throw();
  });

  it('PeekAndRead_MultiByteNumber_BigEndian', () => {
    array[3] = (1234 & 0xff);
    array[2] = ((1234 >> 8) & 0xff);
    const stream = new ByteStream(array.buffer);
    stream.setBigEndian();
    expect(stream.peekNumber(4)).equals(1234);
    expect(stream.readNumber(4)).equals(1234);
    expect(() => stream.readNumber(1)).to.throw();
  });

  it('PeekAndRead_MultiByteNumber_MultiEndian', () => {
    array[1] = 1;
    array[3] = 1;
    // Stream now has 0, 1, 0, 1.
    const stream = new ByteStream(array.buffer);
    stream.setBigEndian();
    expect(stream.peekNumber(2)).equals(1);
    stream.setBigEndian(false);
    expect(stream.peekNumber(2)).equals(256);
    stream.setBigEndian(true);
    expect(stream.peekNumber(2)).equals(1);

    stream.skip(2);

    stream.setLittleEndian();
    expect(stream.peekNumber(2)).equals(256);
    stream.setLittleEndian(false);
    expect(stream.peekNumber(2)).equals(1);
    stream.setLittleEndian(true);
    expect(stream.peekNumber(2)).equals(256);

    stream.skip(2);

    expect(() => stream.readNumber(1)).to.throw();
  });

  it('PeekAndRead_SingleByteSignedNumber', () => {
    array[0] = -120;
    const stream = new ByteStream(array.buffer);
    expect(stream.peekSignedNumber(1)).equals(-120);
    expect(stream.readSignedNumber(1)).equals(-120);
  });

  it('PeekAndRead_SingleByteNegativeNumber', () => {
    array[0] = -128;
    const stream = new ByteStream(array.buffer);
    expect(stream.peekSignedNumber(1)).equals(-128);
    expect(stream.readSignedNumber(1)).equals(-128);
  });

  it('PeekAndRead_MultiByteSignedNumber', () => {
    array[0] = (1234 & 0xff);
    array[1] = ((1234 >> 8) & 0xff);
    const stream = new ByteStream(array.buffer);
    expect(stream.peekSignedNumber(2)).equals(1234);
    expect(stream.peekSignedNumber(2)).equals(1234);
  });

  it('PeekAndRead_MultiByteNegativeNumber', () => {
    array[0] = (-1234 & 0xff);
    array[1] = ((-1234 >> 8) & 0xff);
    const stream = new ByteStream(array.buffer);
    expect(stream.peekSignedNumber(2)).equals(-1234);
    expect(stream.peekSignedNumber(2)).equals(-1234);
  });

  it('ByteStreamReadBytesPastEnd', () => {
    const stream = new ByteStream(array.buffer);
    expect(() => stream.readBytes(5)).to.throw();
  });

  it('ReadStringPastEnd', () => {
    const stream = new ByteStream(array.buffer);
    expect(() => stream.readString(5)).to.throw();
  });

  it('PushThenReadNumber', () => {
    array = new Uint8Array(1);
    array[0] = (1234 & 0xff);
    const stream = new ByteStream(array.buffer);

    const anotherArray = new Uint8Array(1);
    anotherArray[0] = ((1234 >> 8) & 0xff);
    stream.push(anotherArray.buffer);

    expect(stream.readNumber(2)).equals(1234);
  });

  it('ReadBytesThenPushThenReadByte', () => {
    for (let i = 0; i < 4; ++i) array[i] = i;
    const stream = new ByteStream(array.buffer);

    const bytes = stream.readBytes(4);
    expect(() => stream.readBytes(1)).to.throw();

    const anotherArray = new Uint8Array(1);
    anotherArray[0] = 4;
    stream.push(anotherArray.buffer);

    expect(stream.readNumber(1), 'Could not read in byte after pushing').equals(4);
  });

  it('PushThenReadBytesAcrossOnePage', () => {
    for (let i = 0; i < 4; ++i) array[i] = i;
    const stream = new ByteStream(array.buffer);

    const anotherArray = new Uint8Array(1);
    anotherArray[0] = 4;
    stream.push(anotherArray.buffer);

    const bytes = stream.readBytes(5);
    expect(bytes.length).equals(5);
    for (let i = 0; i < 5; ++i) {
      expect(bytes[i]).equals(i);
    }
  });

  it('PushThenReadBytesAcrossMultiplePages', () => {
    for (let i = 0; i < 4; ++i) array[i] = i;
    const stream = new ByteStream(array.buffer);

    const anotherArray = new Uint8Array(4);
    for (let i = 0; i < 4; ++i) anotherArray[i] = i + 4;

    const yetAnotherArray = new Uint8Array(4);
    for (let i = 0; i < 4; ++i) yetAnotherArray[i] = i + 8;

    stream.push(anotherArray.buffer);
    stream.push(yetAnotherArray.buffer);

    const bytes = stream.readBytes(12);
    expect(bytes.length).equals(12);
    for (let i = 0; i < 12; ++i) {
      expect(bytes[i]).equals(i);
    }
  });

  it('PushThenReadStringAcrossMultiplePages', () => {
    for (let i = 0; i < 4; ++i) array[i] = 65 + i;
    const stream = new ByteStream(array.buffer);

    const anotherArray = new Uint8Array(4);
    for (let i = 0; i < 4; ++i) anotherArray[i] = 69 + i;

    const yetAnotherArray = new Uint8Array(4);
    for (let i = 0; i < 4; ++i) yetAnotherArray[i] = 73 + i;

    stream.push(anotherArray.buffer);
    stream.push(yetAnotherArray.buffer);

    const str = stream.readString(12);
    expect(str).equals('ABCDEFGHIJKL');

    const str2 = stream.readString(0);
    expect(str2).equals('');
  });

  describe('skip()', () => {
    /** @type {ByteStream} */
    let stream;

    beforeEach(() => {
      for (let i = 0; i < 4; ++i) array[i] = i;
      stream = new ByteStream(array.buffer);  
    });

    it('skips bytes', () => {
      stream.skip(2);
      expect(stream.getNumBytesRead()).equals(2);
      expect(stream.getNumBytesLeft()).equals(2);
      expect(stream.readNumber(1)).equals(2);
      expect(stream.readNumber(1)).equals(3);
    });

    it('returns itself', () => {
      const retVal = stream.skip(2);
      expect(stream === retVal).equals(true);
    });

    it('skip(0) has no effect', () => {
      const retVal = stream.skip(0);
      expect(stream.getNumBytesRead()).equals(0);
      expect(stream.getNumBytesLeft()).equals(4);
      expect(stream.readNumber(1)).equals(0);
      expect(retVal === stream).equals(true);
    });

    it('skip() with negative throws an error', () => {
      expect(() => stream.skip(-1)).throws();
      expect(stream.getNumBytesLeft()).equals(4);
    });

    it('skip() past the end throws an error', () => {
      expect(() => stream.skip(4)).does.not.throw();
      expect(stream.getNumBytesLeft()).equals(0);
      expect(() => stream.skip(1)).throws();
    });

    it('skip() works correct across pages of bytes', () => {
      const extraArr = new Uint8Array(4);
      for (let i = 0; i < 4; ++i) extraArr[i] = i + 4;
      stream.push(extraArr.buffer);
      expect(stream.readNumber(1)).equals(0);
      stream.skip(5);
      expect(stream.readNumber(1)).equals(6);
    });
  });

  it('Tee', () => {
    for (let i = 0; i < 4; ++i) array[i] = 65 + i;
    const stream = new ByteStream(array.buffer);
    // Set non-default endianness.
    stream.setBigEndian(true);

    const anotherArray = new Uint8Array(4);
    for (let i = 0; i < 4; ++i) anotherArray[i] = 69 + i;
    stream.push(anotherArray.buffer);

    const teed = stream.tee();
    expect(teed !== stream).equals(true);
    teed.readBytes(5);
    expect(stream.getNumBytesLeft()).equals(8);
    expect(teed.getNumBytesLeft()).equals(3);
    expect(teed.isLittleEndian()).equals(stream.isLittleEndian());
  });
});

/*
 * archive-test.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 */

import { ByteBuffer } from '../io/bytebuffer.js';
import 'mocha';
import { expect } from 'chai';

describe('bitjs.io.ByteBuffer', () => {
  /** @type {ByteBuffer} */
  let buffer;

  beforeEach(() => {
    buffer = new ByteBuffer(4);
  });

  describe('getData()', () => {
    it('returns an empty array when nothing has been written', () => {
      expect(buffer.getData().byteLength).equals(0);
    });

    it('is sized correctly', () => {
      buffer.insertByte(42);
      buffer.insertByte(81);
      const data = buffer.getData();
      expect(data.byteLength).equals(2);
      expect(data[0]).equals(42);
      expect(data[1]).equals(81);  
    });
  });

  it('throws when initialized incorrectly', () => {
    expect(() => new ByteBuffer()).throws();
  });

  describe('Buffer overflow', () => {
    it('insertByte() throws when buffer exceeded', () => {
      buffer.insertBytes([0, 2, 4, 6]);
      expect(() => buffer.insertByte(1)).throws();
    });  
    it('insertBytes() throws when buffer exceeded', () => {
      expect(() => buffer.insertBytes([0, 2, 4, 6, 8])).throws();
    });  
  });

  it('insertByte()', () => {
    buffer.insertByte(192);
    expect(buffer.ptr).equals(1);
    expect(buffer.data[0]).equals(192);
  });

  it('writeNumber() with a single unsigned byte', () => {
    buffer.writeNumber(192, 1);
    expect(buffer.ptr).equals(1);
    expect(buffer.data[0]).equals(192);
  });

  it('writeNumber() with a single negative number', () => {
    buffer.writeSignedNumber(-120, 1);
    expect(buffer.ptr).equals(1);
    expect(buffer.data[0]).equals(-120 & 0xff);
  });

  it('Write_MultiByteNumber', () => {
    buffer.writeNumber(1234, 4);
    expect(buffer.ptr).equals(4);
  });

  it('Write_MultiByteNegativeNumber', () => {
    buffer.writeSignedNumber(-1234, 4);
    expect(buffer.ptr).equals(4);
  });

  it('WriteOverflowUnsigned', () => {
    expect(() => buffer.writeNumber(256, 1)).throws();
  });

  it('WriteOverflowSignedPositive', () => {
    expect(() => buffer.writeSignedNumber(128, 1)).throws();
  });

  it('WriteOverflowSignedNegative', () => {
    expect(() => buffer.writeSignedNumber(-129, 1)).throws();
  });

  it('throws when trying to write invalid # of bytes', () => {
    expect(() => buffer.writeNumber(3, -1)).throws();
    expect(() => buffer.writeNumber(-3, 1)).throws();
    expect(() => buffer.writeSignedNumber(-3, -1)).throws();
  });

  it('writes an ASCII string', () => {
    buffer.writeASCIIString('hi');
    expect(buffer.ptr).equals(2);
    expect(buffer.data[0]).equals('h'.charCodeAt(0));
    expect(buffer.data[1]).equals('i'.charCodeAt(0));
  });

  it('throws in a non-ASCII string', () => {
    expect(() => buffer.writeASCIIString('Björk')).throws('Trying to write a non-ASCII string');
  });
});
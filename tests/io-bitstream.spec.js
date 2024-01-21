/*
 * archive-test.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 */

import { BitStream } from '../io/bitstream.js';
import 'mocha';
import { expect } from 'chai';

describe('bitjs.io.BitStream', () => {
  let array;
  beforeEach(() => {
    array = new Uint8Array(4);
    for (let i = 0; i < 4; ++i) {
      array[i] = Number('0b01100101');
    }
  });

  it('throws an error without an ArrayBuffer', () => {
    expect(() => new BitStream()).throws();
  });

  describe('Most-to-Least', () => {
    it('peek() and read()', () => {
      const stream = new BitStream(array.buffer, true /** mtl */);

      expect(stream.peekBits(0)).equals(0);
      expect(stream.peekBits(-1)).equals(0);
      expect(stream.bytePtr).equals(0);
      expect(stream.bitPtr).equals(0);

      // 0110
      expect(stream.readBits(4)).equals(0b0110);
      expect(stream.getNumBitsRead()).equals(4);

      // 0101 011
      expect(stream.readBits(7)).equals(0b0101011);
      // 00101 01100101 01
      expect(stream.readBits(15)).equals(0b001010110010101);
      // 10010
      expect(stream.readBits(5)).equals(0b10010);

      // Ensure the last bit is read, even if we flow past the end of the stream.
      expect(stream.readBits(2)).equals(1);

      expect(stream.getNumBitsRead()).equals(33);
    });

    it('skip() works correctly', () => {
      const stream = new BitStream(array.buffer, true /** mtl */);

      expect(stream.skip(0)).equals(stream);
      expect(stream.getNumBitsRead()).equals(0);
      expect(stream.skip(3)).equals(stream);
      expect(stream.getNumBitsRead()).equals(3);
      expect(stream.readBits(3)).equals(0b001);
      expect(stream.getNumBitsRead()).equals(6);
    });

    it('skip() works over byte boundary', () => {
      const stream = new BitStream(array.buffer, true /** mtl */);
      expect(stream.readBits(5)).equals(0b01100);
      stream.skip(5);
      expect(stream.getNumBitsRead()).equals(10);
      expect(stream.readBits(5)).equals(0b10010);
    });

    it('skip() throws errors if overflowed', () => {
      const stream = new BitStream(array.buffer, true /** mtl */);
      expect(() => stream.skip(-1)).throws();
      stream.readBits(30);
      expect(() => stream.skip(3)).throws();
    });
  });

  describe('Least-to-Most', () => {
    it('peek() and read()', () => {
      /** @type {BitStream} */
      const stream = new BitStream(array.buffer, false /** mtl */);

      expect(stream.peekBits(0)).equals(0);
      expect(stream.peekBits(-1)).equals(0);
      expect(stream.bytePtr).equals(0);
      expect(stream.bitPtr).equals(0);

      // 0101
      expect(stream.peekBits(4)).equals(0b0101);
      expect(stream.readBits(4)).equals(0b0101);
      // 101 0110
      expect(stream.readBits(7)).equals(0b1010110);
      // 01 01100101 01100
      expect(stream.readBits(15)).equals(0b010110010101100);
      // 11001
      expect(stream.readBits(5)).equals(0b11001);

      // Only 1 bit left in the buffer, make sure it reads in, even if we over-read.
      expect(stream.readBits(2)).equals(0);
    });

    it('skip() works correctly', () => {
      const stream = new BitStream(array.buffer, false /** mtl */);

      expect(stream.skip(0)).equals(stream);
      expect(stream.getNumBitsRead()).equals(0);
      expect(stream.skip(3)).equals(stream);
      expect(stream.getNumBitsRead()).equals(3);
      expect(stream.readBits(3)).equals(0b100);
      expect(stream.getNumBitsRead()).equals(6);
    });

    it('skip() works over byte boundary', () => {
      const stream = new BitStream(array.buffer, false /** mtl */);
      expect(stream.readBits(5)).equals(0b00101);
      stream.skip(5);
      expect(stream.getNumBitsRead()).equals(10);
      expect(stream.readBits(5)).equals(0b11001);
    });

    it('skip() throws errors if overflowed', () => {
      const stream = new BitStream(array.buffer, false /** mtl */);
      expect(() => stream.skip(-1)).throws();
      stream.readBits(30);
      expect(() => stream.skip(3)).throws();
    });
  });

  describe('bytes', () => {
    it('peekBytes() and readBytes()', () => {
      array[1] = Number('0b01010110');
      const stream = new BitStream(array.buffer);

      let twoBytes = stream.peekBytes(2);
      expect(twoBytes instanceof Uint8Array).true;
      expect(twoBytes.byteLength).equals(2);
      expect(twoBytes[0]).equals(Number('0b01100101'));
      expect(twoBytes[1]).equals(Number('0b01010110'));

      twoBytes = stream.readBytes(2);
      expect(twoBytes instanceof Uint8Array).true;
      expect(twoBytes.byteLength).equals(2);
      expect(twoBytes[0]).equals(Number('0b01100101'));
      expect(twoBytes[1]).equals(Number('0b01010110'));

      expect(() => stream.readBytes(3)).throws();
    });

    it('peekBytes(0) returns an empty array', () => {
      const stream = new BitStream(array.buffer);
      const arr = stream.peekBytes(0);
      expect(arr.byteLength).equals(0);
    });

    it('peekBytes() should ignore bits until byte-aligned', () => {
      array[1] = Number('0b01010110');
      const stream = new BitStream(array.buffer);
      stream.skip(3);
      const bytes = stream.readBytes(2);
      expect(bytes[0]).equals(0b01010110);
      expect(bytes[1]).equals(0b01100101);
    })

    it('throws an error with weird values of peekBytes()', () => {
      const stream = new BitStream(array.buffer);
      expect(() => stream.peekBytes(-1)).throws();
    });
  });
});

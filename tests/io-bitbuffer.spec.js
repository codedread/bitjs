/*
 * io-bitbuffer.spec.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 */

import { BitBuffer } from '../io/bitbuffer.js';
import 'mocha';
import { expect } from 'chai';

describe('bitjs.io.BitBuffer', () => {
  /** @type {BitBuffer} */
  let buffer;

  it('throws when invalid numBytes', () => {
    expect(() => new BitBuffer()).throws();
  });

  describe('least-to-most-significant bit-packing', () => {
    beforeEach(() => {
      buffer = new BitBuffer(4);
    });

    it('bit/byte pointers initialized properly', () => {
      expect(buffer.getPackingDirection()).equals(false);
      expect(buffer.bytePtr).equals(0);
      expect(buffer.bitPtr).equals(0);
    });

    it('throws when writing invalid values', () => {
      expect(() => buffer.writeBits(-3, 2)).throws();
      expect(() => buffer.writeBits(3, -2)).throws();
      expect(() => buffer.writeBits(0, 54)).throws();
    });

    it('throws when writing too many bits into the buffer', () => {
      buffer.writeBits(0, 31); // thirty-one zeroes.
      expect(() => buffer.writeBits(1, 2)).throws();
    });
  
    it('write multiple bits', () => {
      buffer.writeBits(0b01011, 5); // Should result in: 0b00001011.
      expect(buffer.bytePtr).equals(0);
      expect(buffer.bitPtr).equals(0 + 5);
      expect(Array.from(buffer.data)).to.have.ordered.members([1 + 2 + 8, 0, 0, 0]);
    });

    it('write multiple bits across byte boundary', () => {
      buffer.writeBits(0b01011, 5);
      buffer.writeBits(0b11101, 5); // Should result in: 0b10101011 and 0b00000011.
      expect(buffer.bytePtr).equals(Math.floor((5 + 5) / 8));
      expect(buffer.bitPtr).equals((5 + 5) % 8);
      expect(Array.from(buffer.data)).to.have.ordered.members(
        [1 + 2 + 8 + 32 + 128, 1 + 2, 0, 0]);
    });

    it('write multiple bytes to buffer', () => {
      buffer.writeBits(0, 1);
      buffer.writeBits(0x1ffff, 17); // Should result in 0b111111110, 0b11111111, 0b00000011.
      expect(buffer.bytePtr).equals(2);
      expect(buffer.bitPtr).equals(2);
      expect(Array.from(buffer.data)).to.have.ordered.members(
        [0xfe, 0xff, 0x03, 0x00]);
    });

    it('properly changes bit-packing direction', () => {
      buffer.writeBits(3, 2);
      expect(buffer.data[0]).equals(3);
      expect(buffer.bytePtr).equals(0);
      expect(buffer.bitPtr).equals(2);

      buffer.setPackingDirection(true /** most to least significant */);
      expect(buffer.bytePtr).equals(1);
      expect(buffer.bitPtr).equals(7);

      buffer.writeBits(7, 3);
      expect(buffer.data[0]).equals(3);
      expect(buffer.data[1]).equals(224);
    });

    it('throws when switching packing direction and no more bytes left', () => {
      buffer.writeBits(0, 25);
      expect(() => buffer.setPackingDirection(true)).throws();
    });
  });

  describe('most-to-least-significant bit-packing', () => {
    beforeEach(() => {
      buffer = new BitBuffer(4, true);
    });

    it('bit/byte pointers initialized properly', () => {
      expect(buffer.getPackingDirection()).equals(true);
      expect(buffer.bytePtr).equals(0);
      expect(buffer.bitPtr).equals(7);
    })

    it('write multiple bits', () => {
      buffer.writeBits(0b01011, 5); // Should result in: 0b01011000
      expect(buffer.bytePtr).equals(0);
      expect(buffer.bitPtr).equals(7 - 5);
      expect(Array.from(buffer.data)).to.have.ordered.members(
        [64+16+8, 0, 0, 0]);
    });

    it('write multiple bits across byte boundary', () => {
      buffer.writeBits(0b01011, 5);
      buffer.writeBits(0b11101, 5); // Should result in: 0b01011111 and 0b01000000.
      expect(buffer.bytePtr).equals(Math.floor((5 + 5) / 8));
      expect(buffer.bitPtr).equals(7 - ((5 + 5) % 8));
      expect(Array.from(buffer.data)).to.have.ordered.members(
        [64+16+8+4+2+1, 64, 0, 0]);
    });

    it('write multiple bytes to buffer', () => {
      buffer.writeBits(0, 1);
      buffer.writeBits(0x1ffff, 17); // Should result in 0b011111111, 0b11111111, 0b11000000.
      expect(buffer.bytePtr).equals(2);
      expect(buffer.bitPtr).equals(5);
      expect(Array.from(buffer.data)).to.have.ordered.members(
        [0x7f, 0xff, 0xc0, 0x00]);
    });

    it('properly changes bit-packing direction', () => {
      buffer.writeBits(3, 2);
      expect(buffer.bytePtr).equals(0);
      expect(buffer.bitPtr).equals(5);
      expect(buffer.data[0]).equals(192);

      buffer.setPackingDirection(false /** least to most significant */);
      expect(buffer.bytePtr).equals(1);
      expect(buffer.bitPtr).equals(0);

      buffer.writeBits(7, 3);
      expect(buffer.data[0]).equals(192);
      expect(buffer.data[1]).equals(7);
    });

    it('throws when switching packing direction and no more bytes left', () => {
      buffer.writeBits(0, 25);
      expect(() => buffer.setPackingDirection(false)).throws();
    });
  });
});
